import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateGoalDto, UpdateGoalDto, CreateKeyResultDto, UpdateKeyResultDto } from './goals.dto'

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, status?: string, pillar?: string) {
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(status && { status: status as any }),
        ...(pillar && { pillar: pillar as any }),
      },
      include: {
        keyResults: { orderBy: { createdAt: 'asc' } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    return goals.map((g) => ({ ...g, tasksCount: g._count.tasks }))
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        keyResults: { orderBy: { createdAt: 'asc' } },
        subGoals: { where: { deletedAt: null } },
        tasks: { where: { deletedAt: null, status: { not: 'DONE' } }, take: 5 },
      },
    })
    if (!goal) throw new NotFoundException('Goal not found')
    return goal
  }

  async create(userId: string, dto: CreateGoalDto) {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        pillar: dto.pillar as any,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        parentGoalId: dto.parentGoalId,
      },
      include: { keyResults: true },
    })
    return goal
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.assertOwner(userId, id)
    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...dto,
        pillar: dto.pillar as any,
        status: dto.status as any,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      },
      include: { keyResults: true },
    })
    return goal
  }

  async delete(userId: string, id: string) {
    await this.assertOwner(userId, id)
    await this.prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  }

  // ── KEY RESULTS ──────────────────────────────────────────────────────────

  async addKeyResult(userId: string, goalId: string, dto: CreateKeyResultDto) {
    await this.assertOwner(userId, goalId)
    const kr = await this.prisma.keyResult.create({
      data: { goalId, ...dto, metricType: dto.metricType as any },
    })
    await this.recalculateProgress(goalId)
    return kr
  }

  async updateKeyResult(userId: string, goalId: string, krId: string, dto: UpdateKeyResultDto) {
    await this.assertOwner(userId, goalId)
    const kr = await this.prisma.keyResult.update({
      where: { id: krId, goalId },
      data: dto,
    })
    await this.recalculateProgress(goalId)
    return kr
  }

  async deleteKeyResult(userId: string, goalId: string, krId: string) {
    await this.assertOwner(userId, goalId)
    await this.prisma.keyResult.delete({ where: { id: krId, goalId } })
    await this.recalculateProgress(goalId)
    return { success: true }
  }

  // ── PRIVATE ──────────────────────────────────────────────────────────────

  private async assertOwner(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId, deletedAt: null } })
    if (!goal) throw new ForbiddenException('Goal not found or access denied')
    return goal
  }

  private async recalculateProgress(goalId: string) {
    const krs = await this.prisma.keyResult.findMany({ where: { goalId } })
    if (krs.length === 0) return

    const avg = krs.reduce((acc, kr) => {
      const pct = kr.metricType === 'BOOLEAN'
        ? kr.currentValue >= 1 ? 100 : 0
        : Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
      return acc + pct
    }, 0) / krs.length

    await this.prisma.goal.update({
      where: { id: goalId },
      data: { progress: Math.round(avg) },
    })
  }
}
