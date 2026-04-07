import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import * as crypto from 'crypto'

const API_VERSION = 'v1'
const API_SCOPES = ['goals:read', 'goals:write', 'tasks:read', 'tasks:write', 'analytics:read', 'habits:read']

@Injectable()
export class PublicApiService {
  constructor(private prisma: PrismaService) {}

  // ── API KEY MANAGEMENT ───────────────────────────────────────────────────────

  async listKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, requestCount: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createKey(userId: string, data: { name: string; scopes: string[]; expiresInDays?: number }) {
    // Validate scopes
    const validScopes = data.scopes.filter(s => API_SCOPES.includes(s))

    // Generate key: sk_live_xxxxxxxxxxxxxxxxxxxx
    const rawKey = `sk_live_${crypto.randomBytes(24).toString('base64url')}`
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12) + '...'

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const key = await this.prisma.apiKey.create({
      data: { userId, name: data.name, keyHash, keyPrefix, scopes: validScopes, expiresAt },
    })

    // Only return the raw key once — it cannot be retrieved again
    return { id: key.id, name: key.name, key: rawKey, keyPrefix, scopes: validScopes, expiresAt }
  }

  async revokeKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } })
    if (!key) throw new NotFoundException('API key not found')
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } })
    return { success: true }
  }

  async validateKey(rawKey: string, requiredScope?: string): Promise<{ userId: string; keyId: string; scopes: string[] }> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, userId: true, scopes: true, revokedAt: true, expiresAt: true },
    })

    if (!apiKey || apiKey.revokedAt) throw new UnauthorizedException('Invalid API key')
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) throw new UnauthorizedException('API key expired')
    if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
      throw new ForbiddenException(`Scope "${requiredScope}" required`)
    }

    // Update usage stats (non-blocking)
    this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date(), requestCount: { increment: 1 } },
    }).catch(() => {})

    return { userId: apiKey.userId, keyId: apiKey.id, scopes: apiKey.scopes }
  }

  // ── PUBLIC API DATA ENDPOINTS ─────────────────────────────────────────────────

  async getGoals(userId: string, params: { status?: string; pillar?: string; limit?: number; page?: number }) {
    const { status, pillar, limit = 20, page = 1 } = params
    const where: any = { userId, deletedAt: null }
    if (status) where.status = status
    if (pillar) where.pillar = pillar

    const [data, total] = await Promise.all([
      this.prisma.goal.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { keyResults: true },
      }),
      this.prisma.goal.count({ where }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), apiVersion: API_VERSION } }
  }

  async getTasks(userId: string, params: { status?: string; priority?: string; limit?: number; page?: number }) {
    const { status, priority, limit = 20, page = 1 } = params
    const where: any = { userId, deletedAt: null }
    if (status) where.status = status
    if (priority) where.priority = priority

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.task.count({ where }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), apiVersion: API_VERSION } }
  }

  async getAnalytics(userId: string) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

    const [activeGoals, doneToday, streak, habitRate] = await Promise.all([
      this.prisma.goal.findMany({ where: { userId, status: 'ACTIVE', deletedAt: null }, select: { progress: true, pillar: true } }),
      this.prisma.task.count({ where: { userId, status: 'DONE', completedAt: { gte: todayStart } } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { streakCount: true, energyLevel: true } }),
      this.prisma.habitLog.count({ where: { userId, completedAt: { gte: weekAgo } } }),
    ])

    return {
      streakDays: streak?.streakCount || 0,
      energyLevel: streak?.energyLevel ?? null,
      tasksDoneToday: doneToday,
      activeGoals: activeGoals.length,
      avgGoalProgress: activeGoals.length ? Math.round(activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length) : 0,
      habitLogsThisWeek: habitRate,
      apiVersion: API_VERSION,
      timestamp: new Date().toISOString(),
    }
  }

  getScopes() {
    return {
      scopes: API_SCOPES.map(s => ({
        name: s,
        description: {
          'goals:read': 'Read goals and key results',
          'goals:write': 'Create and update goals',
          'tasks:read': 'Read tasks',
          'tasks:write': 'Create and update tasks',
          'analytics:read': 'Read analytics data',
          'habits:read': 'Read habits and logs',
        }[s],
      })),
    }
  }
}
