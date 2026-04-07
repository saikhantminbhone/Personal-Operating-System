import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, limit = 30) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    })
  }

  async findToday(userId: string) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    return this.prisma.journalEntry.findFirst({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' },
    })
  }

  async create(userId: string, data: { content: string; mood?: number; date?: string }) {
    return this.prisma.journalEntry.create({
      data: {
        userId,
        content: data.content,
        mood: data.mood,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })
  }

  async update(userId: string, id: string, data: { content?: string; mood?: number }) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, userId } })
    if (!entry) throw new NotFoundException('Journal entry not found')
    return this.prisma.journalEntry.update({ where: { id }, data })
  }

  async delete(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, userId } })
    if (!entry) throw new NotFoundException('Journal entry not found')
    await this.prisma.journalEntry.delete({ where: { id } })
    return { success: true }
  }
}
