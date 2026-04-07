import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateNoteDto, UpdateNoteDto, CreateCollectionDto } from './knowledge.dto'

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async getNotes(userId: string, options: { collectionId?: string; search?: string; tags?: string; pinned?: boolean; limit?: number; page?: number } = {}) {
    const { collectionId, search, limit = 30, page = 1, pinned } = options
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.max(1, Number(limit) || 30)
    const skip = (pageNum - 1) * limitNum
    const where: any = { userId, deletedAt: null }
    if (collectionId) where.collectionId = collectionId
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { content: { contains: search, mode: 'insensitive' } }]
    if (pinned !== undefined) where.pinned = pinned

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where, include: { collection: { select: { id: true, name: true, color: true } } },
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        skip, take: limitNum,
      }),
      this.prisma.note.count({ where }),
    ])

    return { data: notes, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  }

  async getNote(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
      include: { collection: true },
    })
    if (!note) throw new NotFoundException('Note not found')
    return note
  }

  async createNote(userId: string, dto: CreateNoteDto) {
    const wordCount = dto.content ? dto.content.split(/\s+/).filter(Boolean).length : 0
    return this.prisma.note.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        collectionId: dto.collectionId,
        type: (dto.type || 'NOTE') as any,
        tags: dto.tags || [],
        sourceUrl: dto.sourceUrl,
        wordCount,
      },
    })
  }

  async updateNote(userId: string, id: string, dto: UpdateNoteDto) {
    await this.assertNoteOwner(userId, id)
    const wordCount = dto.content ? dto.content.split(/\s+/).filter(Boolean).length : undefined
    return this.prisma.note.update({
      where: { id },
      data: { ...dto, ...(wordCount !== undefined && { wordCount }) },
    })
  }

  async deleteNote(userId: string, id: string) {
    await this.assertNoteOwner(userId, id)
    await this.prisma.note.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  }

  async getCollections(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: { _count: { select: { notes: { where: { deletedAt: null } } } } },
      orderBy: { name: 'asc' },
    })
    return collections.map(c => ({ ...c, noteCount: c._count.notes }))
  }

  async createCollection(userId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: { userId, ...dto, color: dto.color || '#64ffda', icon: dto.icon || '📁' },
    })
  }

  async deleteCollection(userId: string, id: string) {
    const col = await this.prisma.collection.findFirst({ where: { id, userId } })
    if (!col) throw new ForbiddenException('Collection not found')
    // Unlink notes from this collection
    await this.prisma.note.updateMany({ where: { collectionId: id, userId }, data: { collectionId: null } })
    await this.prisma.collection.delete({ where: { id } })
    return { success: true }
  }

  async getDailyNote(userId: string) {
    const today = new Date().toISOString().slice(0, 10)
    const title = `Daily Note — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`

    let note = await this.prisma.note.findFirst({
      where: { userId, type: 'DAILY', title: { contains: today } },
    })

    if (!note) {
      note = await this.prisma.note.create({
        data: { userId, title, type: 'DAILY', content: `# ${title}\n\n## Today's Focus\n\n\n## Notes\n\n\n## Reflections\n\n` },
      })
    }

    return note
  }

  async getStats(userId: string) {
    const [totalNotes, totalCollections, recentNotes] = await Promise.all([
      this.prisma.note.count({ where: { userId, deletedAt: null } }),
      this.prisma.collection.count({ where: { userId } }),
      this.prisma.note.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, updatedAt: true, type: true } }),
    ])
    return { totalNotes, totalCollections, recentNotes }
  }

  private async assertNoteOwner(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId, deletedAt: null } })
    if (!note) throw new ForbiddenException('Note not found or access denied')
    return note
  }
}
