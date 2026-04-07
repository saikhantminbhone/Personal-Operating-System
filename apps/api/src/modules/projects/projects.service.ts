import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId, deletedAt: null },
      include: {
        goal: { select: { id: true, title: true, pillar: true } },
        _count: { select: { tasks: { where: { deletedAt: null } }, sprints: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        goal: { select: { id: true, title: true } },
        sprints: { orderBy: { startDate: 'desc' } },
        tasks: { where: { deletedAt: null }, orderBy: [{ status: 'asc' }, { priority: 'desc' }] },
      },
    })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  async create(userId: string, data: any) {
    return this.prisma.project.create({
      data: { userId, ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, targetDate: data.targetDate ? new Date(data.targetDate) : undefined },
    })
  }

  async update(userId: string, id: string, data: any) {
    await this.assertOwner(userId, id)
    return this.prisma.project.update({
      where: { id },
      data: { ...data, targetDate: data.targetDate ? new Date(data.targetDate) : undefined },
    })
  }

  async delete(userId: string, id: string) {
    await this.assertOwner(userId, id)
    await this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  }

  async createSprint(userId: string, projectId: string, data: any) {
    await this.assertOwner(userId, projectId)
    return this.prisma.sprint.create({
      data: { projectId, title: data.title, goal: data.goal, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
    })
  }

  async getKanban(userId: string, projectId: string) {
    await this.assertOwner(userId, projectId)
    const tasks = await this.prisma.task.findMany({
      where: { projectId, userId, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })

    return {
      BACKLOG: tasks.filter(t => t.status === 'TODO' && !t.dueDate),
      TODO: tasks.filter(t => t.status === 'TODO' && t.dueDate),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE'),
    }
  }

  private async assertOwner(userId: string, projectId: string) {
    const p = await this.prisma.project.findFirst({ where: { id: projectId, userId, deletedAt: null } })
    if (!p) throw new ForbiddenException('Project not found or access denied')
    return p
  }
}
