import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, energyLevel: true, lastCheckinAt: true },
    })

    const [activeGoals, tasksDoneToday, tasksPending, totalHabits, habitsCompletedToday, wins] =
      await Promise.all([
        this.prisma.goal.findMany({
          where: { userId, deletedAt: null, status: 'ACTIVE' },
          select: { progress: true },
        }),
        this.prisma.task.count({
          where: { userId, deletedAt: null, status: 'DONE', completedAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.task.count({
          where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } },
        }),
        this.prisma.habit.count({ where: { userId, archivedAt: null } }),
        this.prisma.habitLog.count({
          where: { userId, completedAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.win.count({ where: { userId } }),
      ])

    const overallGoalProgress = activeGoals.length
      ? Math.round(activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length)
      : 0

    return {
      streakCount: user?.streakCount || 0,
      energyLevel: user?.energyLevel ?? null,
      lastCheckinAt: user?.lastCheckinAt?.toISOString() || null,
      activeGoalsCount: activeGoals.length,
      tasksDoneToday,
      tasksPendingCount: tasksPending,
      overallGoalProgress,
      habitsCompletedToday,
      totalHabits,
      totalWins: wins,
    }
  }

  async getGoalProgressByPillar(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, deletedAt: null, status: 'ACTIVE' },
      select: { pillar: true, progress: true },
    })

    const pillars: Record<string, { total: number; count: number }> = {}
    for (const g of goals) {
      if (!pillars[g.pillar]) pillars[g.pillar] = { total: 0, count: 0 }
      pillars[g.pillar].total += g.progress
      pillars[g.pillar].count++
    }

    return Object.entries(pillars).map(([pillar, { total, count }]) => ({
      pillar,
      avgProgress: Math.round(total / count),
      goalsCount: count,
    }))
  }

  async getProductivityTrend(userId: string, days = 30) {
    const start = new Date()
    start.setDate(start.getDate() - days)

    const completedTasks = await this.prisma.task.findMany({
      where: { userId, deletedAt: null, status: 'DONE', completedAt: { gte: start } },
      select: { completedAt: true },
    })

    const trend: Record<string, number> = {}
    for (const t of completedTasks) {
      if (!t.completedAt) continue
      const date = t.completedAt.toISOString().slice(0, 10)
      trend[date] = (trend[date] || 0) + 1
    }

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async getHabitHeatmap(userId: string) {
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)

    const logs = await this.prisma.habitLog.findMany({
      where: { userId, completedAt: { gte: yearAgo } },
      select: { completedAt: true },
    })

    const heatmap: Record<string, number> = {}
    for (const log of logs) {
      const date = log.completedAt.toISOString().slice(0, 10)
      heatmap[date] = (heatmap[date] || 0) + 1
    }

    return heatmap
  }
}
