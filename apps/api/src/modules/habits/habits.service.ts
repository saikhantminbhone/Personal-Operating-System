import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateHabitDto, UpdateHabitDto, LogHabitDto } from './habits.dto'

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId, archivedAt: null },
      include: {
        logs: {
          where: { completedAt: { gte: this.startOfDay(), lte: this.endOfDay() } },
          orderBy: { completedAt: 'desc' },
        },
        _count: { select: { logs: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })

    return habits.map(h => ({
      ...h,
      completedToday: h.logs.length >= h.targetCount,
      todayLogs: h.logs,
      totalLogs: h._count.logs,
    }))
  }

  async findOne(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId, archivedAt: null },
      include: {
        logs: { orderBy: { completedAt: 'desc' }, take: 60 },
      },
    })
    if (!habit) throw new NotFoundException('Habit not found')
    return habit
  }

  async create(userId: string, dto: CreateHabitDto) {
    const count = await this.prisma.habit.count({ where: { userId, archivedAt: null } })
    return this.prisma.habit.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        frequency: (dto.frequency || 'DAILY') as any,
        frequencyDays: dto.frequencyDays || [],
        targetCount: dto.targetCount || 1,
        color: dto.color || '#64ffda',
        icon: dto.icon || '✓',
        order: count,
      },
    })
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.assertOwner(userId, id)
    return this.prisma.habit.update({ where: { id }, data: dto })
  }

  async archive(userId: string, id: string) {
    await this.assertOwner(userId, id)
    await this.prisma.habit.update({ where: { id }, data: { archivedAt: new Date() } })
    return { success: true }
  }

  async log(userId: string, habitId: string, dto: LogHabitDto) {
    await this.assertOwner(userId, habitId)

    const completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date()

    // Check if already logged today
    const existing = await this.prisma.habitLog.findFirst({
      where: {
        habitId,
        userId,
        completedAt: { gte: this.startOfDay(completedAt), lte: this.endOfDay(completedAt) },
      },
    })

    if (existing) throw new ConflictException('Habit already logged for this period')

    const log = await this.prisma.habitLog.create({
      data: { habitId, userId, note: dto.note, completedAt },
    })

    // Update streak
    await this.recalculateStreak(habitId)
    return log
  }

  async unlog(userId: string, habitId: string, logId: string) {
    const log = await this.prisma.habitLog.findFirst({ where: { id: logId, habitId, userId } })
    if (!log) throw new NotFoundException('Log not found')
    await this.prisma.habitLog.delete({ where: { id: logId } })
    await this.recalculateStreak(habitId)
    return { success: true }
  }

  async getTodaySummary(userId: string) {
    const habits = await this.findAll(userId)
    const dueToday = habits.filter(h => this.isDueToday(h))
    const completedToday = dueToday.filter(h => h.completedToday)

    return {
      total: habits.length,
      dueToday: dueToday.length,
      completedToday: completedToday.length,
      completionRate: dueToday.length > 0
        ? Math.round((completedToday.length / dueToday.length) * 100)
        : 0,
      habits: dueToday.map(h => ({
        id: h.id,
        title: h.title,
        icon: h.icon,
        color: h.color,
        completedToday: h.completedToday,
        currentStreak: h.currentStreak,
      })),
    }
  }

  async getWeeklyStats(userId: string) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const logs = await this.prisma.habitLog.findMany({
      where: { userId, completedAt: { gte: weekAgo } },
      include: { habit: { select: { title: true, color: true, icon: true } } },
      orderBy: { completedAt: 'desc' },
    })

    const byDay: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      byDay[d.toISOString().slice(0, 10)] = 0
    }
    for (const log of logs) {
      const day = log.completedAt.toISOString().slice(0, 10)
      if (byDay[day] !== undefined) byDay[day]++
    }

    return {
      totalLogs: logs.length,
      byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    }
  }

  private async recalculateStreak(habitId: string) {
    const logs = await this.prisma.habitLog.findMany({
      where: { habitId },
      orderBy: { completedAt: 'desc' },
    })

    let streak = 0
    let longest = 0
    let current = new Date()
    current.setHours(0, 0, 0, 0)

    const logDates = new Set(logs.map(l => l.completedAt.toISOString().slice(0, 10)))

    for (let i = 0; i < 365; i++) {
      const dateStr = current.toISOString().slice(0, 10)
      if (logDates.has(dateStr)) {
        streak++
        if (streak > longest) longest = streak
      } else if (i > 0) {
        break
      }
      current.setDate(current.getDate() - 1)
    }

    await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak: streak,
        longestStreak: { set: Math.max(streak, (await this.prisma.habit.findUnique({ where: { id: habitId } }))!.longestStreak) },
        totalCompleted: logs.length,
      },
    })
  }

  private isDueToday(habit: any) {
    if (habit.frequency === 'DAILY') return true
    if (habit.frequency === 'WEEKLY' || habit.frequency === 'CUSTOM') {
      const dayOfWeek = new Date().getDay()
      return (habit.frequencyDays as number[]).includes(dayOfWeek)
    }
    return true
  }

  private startOfDay(date = new Date()) {
    const d = new Date(date); d.setHours(0, 0, 0, 0); return d
  }

  private endOfDay(date = new Date()) {
    const d = new Date(date); d.setHours(23, 59, 59, 999); return d
  }

  private async assertOwner(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id: habitId, userId, archivedAt: null } })
    if (!habit) throw new ForbiddenException('Habit not found or access denied')
    return habit
  }
}
