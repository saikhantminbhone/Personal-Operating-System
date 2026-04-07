import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class WinsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, limit = 50) {
    return this.prisma.win.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    })
  }

  async create(userId: string, data: { title: string; details?: string; pillar?: string; date?: string }) {
    return this.prisma.win.create({
      data: {
        userId,
        title: data.title,
        details: data.details,
        pillar: (data.pillar as any) || undefined,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })
  }

  async delete(userId: string, id: string) {
    const win = await this.prisma.win.findFirst({ where: { id, userId } })
    if (!win) throw new NotFoundException('Win not found')
    await this.prisma.win.delete({ where: { id } })
    return { success: true }
  }
}
