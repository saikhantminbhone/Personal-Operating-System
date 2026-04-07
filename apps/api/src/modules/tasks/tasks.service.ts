import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto'

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, options: {
    status?: string; priority?: string; goalId?: string;
    energyLevel?: number; limit?: number; page?: number
  } = {}) {
    const { status, priority, goalId, energyLevel, limit = 50, page = 1 } = options
    const skip = (page - 1) * limit

    const where: any = { userId, deletedAt: null }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (goalId) where.goalId = goalId
    if (energyLevel !== undefined) where.energyRequired = { lte: energyLevel }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          goal: { select: { id: true, title: true, pillar: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ])

    return {
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findTodayFocusQueue(userId: string, energyLevel?: number) {
    const where: any = {
      userId,
      deletedAt: null,
      status: { in: ['TODO', 'IN_PROGRESS'] },
    }
    if (energyLevel !== undefined) where.energyRequired = { lte: energyLevel }

    const tasks = await this.prisma.task.findMany({
      where,
      include: { goal: { select: { id: true, title: true, pillar: true } } },
      orderBy: [{ priority: 'desc' }, { energyRequired: 'desc' }, { dueDate: 'asc' }],
      take: 10,
    })

    return tasks
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        goal: { select: { id: true, title: true, pillar: true } },
        project: { select: { id: true, title: true } },
      },
    })
    if (!task) throw new NotFoundException('Task not found')
    return task
  }

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        goalId: dto.goalId || undefined,
        projectId: dto.projectId || undefined,
        priority: (dto.priority as any) || 'MEDIUM',
        energyRequired: dto.energyRequired ?? 2,
        estimatedMinutes: dto.estimatedMinutes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        recurrenceRule: dto.recurrenceRule,
        tags: dto.tags || [],
      },
      include: { goal: { select: { id: true, title: true, pillar: true } } },
    })
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.assertOwner(userId, id)
    const data: any = { ...dto }
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate)
    if (dto.status === 'DONE') data.completedAt = new Date()
    if (dto.status && dto.status !== 'DONE') data.completedAt = null

    return this.prisma.task.update({
      where: { id },
      data,
      include: { goal: { select: { id: true, title: true, pillar: true } } },
    })
  }

  async complete(userId: string, id: string) {
    await this.assertOwner(userId, id)
    return this.prisma.task.update({
      where: { id },
      data: { status: 'DONE', completedAt: new Date() },
    })
  }

  async delete(userId: string, id: string) {
    await this.assertOwner(userId, id)
    await this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  }

  async getTodayStats(userId: string) {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)

    const [doneToday, pending] = await Promise.all([
      this.prisma.task.count({
        where: { userId, deletedAt: null, status: 'DONE', completedAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.task.count({
        where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } },
      }),
    ])

    return { doneToday, pending }
  }

  private async assertOwner(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId, deletedAt: null } })
    if (!task) throw new ForbiddenException('Task not found or access denied')
    return task
  }
}
