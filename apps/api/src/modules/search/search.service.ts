import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

interface SearchResult {
  id: string
  entityType: string
  entityId: string
  title: string
  subtitle?: string
  url: string
  highlight?: string
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name)
  private meilisearch: any = null

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const { MeiliSearch } = require('meilisearch')
      this.meilisearch = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_API_KEY || '',
      })
      await this.ensureIndexes()
      this.logger.log('Meilisearch connected')
    } catch (err) {
      this.logger.warn('Meilisearch not available — using database search fallback')
    }
  }

  private async ensureIndexes() {
    if (!this.meilisearch) return
    try {
      const indexes = [
        { uid: 'notes', primaryKey: 'id', searchableAttributes: ['title', 'content', 'tags'], filterableAttributes: ['userId', 'type', 'collectionId'] },
        { uid: 'tasks', primaryKey: 'id', searchableAttributes: ['title', 'description', 'tags'], filterableAttributes: ['userId', 'status', 'priority'] },
        { uid: 'goals', primaryKey: 'id', searchableAttributes: ['title', 'description'], filterableAttributes: ['userId', 'pillar', 'status'] },
      ]
      for (const index of indexes) {
        try {
          await this.meilisearch.createIndex(index.uid, { primaryKey: index.primaryKey })
          await this.meilisearch.index(index.uid).updateSettings({
            searchableAttributes: index.searchableAttributes,
            filterableAttributes: index.filterableAttributes,
          })
        } catch {}
      }
    } catch (err) {
      this.logger.warn('Could not configure Meilisearch indexes')
    }
  }

  async search(userId: string, query: string, options: { types?: string[]; limit?: number } = {}): Promise<SearchResult[]> {
    const { types, limit = 20 } = options

    if (!query.trim()) return []

    // Try Meilisearch first
    if (this.meilisearch) {
      try {
        return await this.searchWithMeilisearch(userId, query, types, limit)
      } catch (err) {
        this.logger.warn('Meilisearch search failed, falling back to DB')
      }
    }

    // Database fallback
    return await this.searchWithDatabase(userId, query, types, limit)
  }

  private async searchWithMeilisearch(userId: string, query: string, types?: string[], limit = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const filter = `userId = "${userId}"`
    const searchTypes = types || ['notes', 'tasks', 'goals']

    for (const type of searchTypes) {
      try {
        const { hits } = await this.meilisearch.index(type).search(query, {
          limit: Math.ceil(limit / searchTypes.length),
          filter,
          attributesToHighlight: ['title', 'content'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
        })

        for (const hit of hits) {
          results.push({
            id: `${type}_${hit.id}`,
            entityType: type,
            entityId: hit.id,
            title: hit.title,
            subtitle: hit._formatted?.content?.slice(0, 100) || '',
            url: `/dashboard/${type}`,
            highlight: hit._formatted?.title || hit.title,
          })
        }
      } catch {}
    }

    return results.slice(0, limit)
  }

  private async searchWithDatabase(userId: string, query: string, types?: string[], limit = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const searchTypes = types || ['notes', 'tasks', 'goals']
    const perType = Math.ceil(limit / searchTypes.length)
    const q = query.toLowerCase()

    if (searchTypes.includes('notes')) {
      const notes = await this.prisma.note.findMany({
        where: { userId, deletedAt: null, OR: [{ title: { contains: q, mode: 'insensitive' } }, { content: { contains: q, mode: 'insensitive' } }] },
        take: perType, orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, content: true, type: true },
      })
      results.push(...notes.map(n => ({ id: `note_${n.id}`, entityType: 'notes', entityId: n.id, title: n.title, subtitle: n.content?.slice(0, 100) || '', url: `/dashboard/knowledge`, highlight: n.title })))
    }

    if (searchTypes.includes('tasks')) {
      const tasks = await this.prisma.task.findMany({
        where: { userId, deletedAt: null, OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
        take: perType, orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, priority: true },
      })
      results.push(...tasks.map(t => ({ id: `task_${t.id}`, entityType: 'tasks', entityId: t.id, title: t.title, subtitle: `${t.status} · ${t.priority}`, url: `/dashboard/tasks`, highlight: t.title })))
    }

    if (searchTypes.includes('goals')) {
      const goals = await this.prisma.goal.findMany({
        where: { userId, deletedAt: null, OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
        take: perType, orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, pillar: true, progress: true },
      })
      results.push(...goals.map(g => ({ id: `goal_${g.id}`, entityType: 'goals', entityId: g.id, title: g.title, subtitle: `${g.pillar} · ${g.progress}%`, url: `/dashboard/goals`, highlight: g.title })))
    }

    return results.slice(0, limit)
  }

  async indexDocument(type: string, doc: any) {
    if (!this.meilisearch) return
    try {
      await this.meilisearch.index(type).addDocuments([doc])
    } catch (err) {
      this.logger.warn(`Failed to index ${type} document`)
    }
  }

  async removeDocument(type: string, id: string) {
    if (!this.meilisearch) return
    try {
      await this.meilisearch.index(type).deleteDocument(id)
    } catch {}
  }

  async reindexAll(userId: string) {
    if (!this.meilisearch) return { indexed: 0, message: 'Meilisearch not configured' }
    let indexed = 0

    const [notes, tasks, goals] = await Promise.all([
      this.prisma.note.findMany({ where: { userId, deletedAt: null }, select: { id: true, title: true, content: true, type: true, tags: true, collectionId: true } }),
      this.prisma.task.findMany({ where: { userId, deletedAt: null }, select: { id: true, title: true, description: true, tags: true, status: true, priority: true } }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null }, select: { id: true, title: true, description: true, pillar: true, status: true } }),
    ])

    const addUserId = (docs: any[]) => docs.map(d => ({ ...d, userId }))

    try { await this.meilisearch.index('notes').addDocuments(addUserId(notes)); indexed += notes.length } catch {}
    try { await this.meilisearch.index('tasks').addDocuments(addUserId(tasks)); indexed += tasks.length } catch {}
    try { await this.meilisearch.index('goals').addDocuments(addUserId(goals)); indexed += goals.length } catch {}

    return { indexed, message: `Indexed ${indexed} documents` }
  }
}
