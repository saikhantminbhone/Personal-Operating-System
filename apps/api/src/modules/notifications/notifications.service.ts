import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } })
    return { count }
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    })
    return { success: true }
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
    return { success: true }
  }

  async createNotification(userId: string, data: {
    type: string; title: string; body: string; notificationData?: any
  }) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: data.type as any,
        title: data.title,
        body: data.body,
        data: data.notificationData,
      },
    })
  }

  async deleteNotification(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } })
    return { success: true }
  }

  // ── SCHEDULED JOBS ────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyHabitReminders() {
    this.logger.log('Running daily habit reminders...')
    try {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      })

      for (const user of users) {
        const habits = await this.prisma.habit.findMany({
          where: { userId: user.id, archivedAt: null, frequency: 'DAILY' },
          select: { id: true, title: true, icon: true },
        })

        if (habits.length > 0) {
          await this.createNotification(user.id, {
            type: 'HABIT_REMINDER',
            title: '🌅 Morning habit check-in',
            body: `You have ${habits.length} habit${habits.length > 1 ? 's' : ''} to complete today: ${habits.slice(0, 3).map(h => h.title).join(', ')}${habits.length > 3 ? '...' : ''}`,
            notificationData: { habitIds: habits.map(h => h.id) },
          })
        }
      }
      this.logger.log(`Sent habit reminders to ${users.length} users`)
    } catch (err) {
      this.logger.error('Failed to send habit reminders', err)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkStreaksAtRisk() {
    this.logger.log('Checking streaks at risk...')
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)

      const habits = await this.prisma.habit.findMany({
        where: { archivedAt: null, currentStreak: { gte: 3 } },
        include: {
          logs: { where: { completedAt: { gte: yesterday, lte: yesterdayEnd } } },
          user: { select: { id: true, name: true } },
        },
      })

      for (const habit of habits) {
        if (habit.logs.length === 0) {
          await this.createNotification(habit.userId, {
            type: 'STREAK_AT_RISK',
            title: '⚠️ Streak at risk!',
            body: `Your ${habit.currentStreak}-day streak on "${habit.title}" is at risk. Complete it today to keep the streak!`,
            notificationData: { habitId: habit.id, streak: habit.currentStreak },
          })
        }
      }
    } catch (err) {
      this.logger.error('Failed to check streaks', err)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async checkDueTasks() {
    this.logger.log('Checking due tasks...')
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(23, 59, 59, 999)
      const now = new Date()

      const tasks = await this.prisma.task.findMany({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          deletedAt: null,
          dueDate: { gte: now, lte: tomorrow },
        },
        include: { user: { select: { id: true } } },
        orderBy: { dueDate: 'asc' },
        take: 200,
      })

      const byUser: Record<string, typeof tasks> = {}
      for (const task of tasks) {
        if (!byUser[task.userId]) byUser[task.userId] = []
        byUser[task.userId].push(task)
      }

      for (const [userId, userTasks] of Object.entries(byUser)) {
        await this.createNotification(userId, {
          type: 'TASK_DUE',
          title: `📋 ${userTasks.length} task${userTasks.length > 1 ? 's' : ''} due soon`,
          body: userTasks.slice(0, 3).map(t => t.title).join(', ') + (userTasks.length > 3 ? '...' : ''),
          notificationData: { taskIds: userTasks.map(t => t.id) },
        })
      }
    } catch (err) {
      this.logger.error('Failed to check due tasks', err)
    }
  }

  @Cron('0 9 * * 1') // Monday 9am
  async sendWeeklySummary() {
    this.logger.log('Sending weekly summaries...')
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, streakCount: true },
      })

      for (const user of users) {
        const [doneTasks, completedHabits] = await Promise.all([
          this.prisma.task.count({ where: { userId: user.id, status: 'DONE', completedAt: { gte: weekAgo } } }),
          this.prisma.habitLog.count({ where: { userId: user.id, completedAt: { gte: weekAgo } } }),
        ])

        await this.createNotification(user.id, {
          type: 'WEEKLY_SUMMARY',
          title: '📊 Your weekly summary',
          body: `Last week: ${doneTasks} tasks completed, ${completedHabits} habit check-ins, ${user.streakCount}-day streak. Keep pushing!`,
          notificationData: { doneTasks, completedHabits, streak: user.streakCount },
        })
      }
    } catch (err) {
      this.logger.error('Failed to send weekly summaries', err)
    }
  }
}
