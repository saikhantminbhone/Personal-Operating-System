import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { name: string; slug?: string }) {
    const slug = data.slug || this.slugify(data.name)
    const exists = await this.prisma.organization.findUnique({ where: { slug } })
    if (exists) throw new ConflictException(`Slug "${slug}" is already taken`)

    return this.prisma.organization.create({
      data: {
        name: data.name, slug,
        members: { create: { userId, role: 'OWNER', joinedAt: new Date() } },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    })
  }

  async findMyOrgs(userId: string) {
    return this.prisma.organization.findMany({
      where: { deletedAt: null, members: { some: { userId, joinedAt: { not: null } } } },
      include: {
        _count: { select: { members: true } },
        members: { where: { userId }, select: { role: true } },
      },
    })
  }

  async findOne(userId: string, orgId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null, members: { some: { userId } } },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } },
    })
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }

  async update(userId: string, orgId: string, data: any) {
    await this.assertRole(userId, orgId, ['OWNER', 'ADMIN'])
    return this.prisma.organization.update({ where: { id: orgId }, data })
  }

  async delete(userId: string, orgId: string) {
    await this.assertRole(userId, orgId, ['OWNER'])
    await this.prisma.organization.update({ where: { id: orgId }, data: { deletedAt: new Date() } })
    return { success: true }
  }

  async getMembers(userId: string, orgId: string) {
    await this.assertMember(userId, orgId)
    return this.prisma.orgMember.findMany({
      where: { organizationId: orgId, joinedAt: { not: null } },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    })
  }

  async inviteMember(userId: string, orgId: string, email: string, role = 'MEMBER') {
    await this.assertRole(userId, orgId, ['OWNER', 'ADMIN'])
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7)
    const invitation = await this.prisma.invitation.create({
      data: { organizationId: orgId, email, role: role as any, invitedBy: userId, expiresAt },
    })
    return { invitation, inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitation.token}` }
  }

  async acceptInvite(userId: string, token: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { token } })
    if (!inv) throw new NotFoundException('Invitation not found')
    if (inv.expiresAt < new Date()) throw new BadRequestException('Invitation expired')
    if (inv.acceptedAt) throw new BadRequestException('Already used')
    await this.prisma.$transaction([
      this.prisma.orgMember.create({ data: { organizationId: inv.organizationId, userId, role: inv.role, joinedAt: new Date(), invitedBy: inv.invitedBy } }),
      this.prisma.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } }),
    ])
    return { success: true }
  }

  async removeMember(userId: string, orgId: string, targetId: string) {
    await this.assertRole(userId, orgId, ['OWNER', 'ADMIN'])
    await this.prisma.orgMember.delete({ where: { organizationId_userId: { organizationId: orgId, userId: targetId } } })
    return { success: true }
  }

  async leaveOrg(userId: string, orgId: string) {
    const m = await this.prisma.orgMember.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId } } })
    if (!m) throw new NotFoundException('Not a member')
    if (m.role === 'OWNER') throw new ForbiddenException('Owner cannot leave')
    await this.prisma.orgMember.delete({ where: { organizationId_userId: { organizationId: orgId, userId } } })
    return { success: true }
  }

  async getStats(userId: string, orgId: string) {
    await this.assertMember(userId, orgId)
    const memberIds = (await this.prisma.orgMember.findMany({ where: { organizationId: orgId }, select: { userId: true } })).map(m => m.userId)
    const [total, done, goals] = await Promise.all([
      this.prisma.task.count({ where: { userId: { in: memberIds }, deletedAt: null } }),
      this.prisma.task.count({ where: { userId: { in: memberIds }, status: 'DONE', deletedAt: null } }),
      this.prisma.goal.count({ where: { userId: { in: memberIds }, status: 'ACTIVE', deletedAt: null } }),
    ])
    return { memberCount: memberIds.length, totalTasks: total, doneTasks: done, completionRate: total > 0 ? Math.round((done / total) * 100) : 0, activeGoals: goals }
  }

  private async assertRole(userId: string, orgId: string, roles: string[]) {
    const m = await this.prisma.orgMember.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId } } })
    if (!m || !roles.includes(m.role)) throw new ForbiddenException('Insufficient permissions')
    return m
  }

  private async assertMember(userId: string, orgId: string) {
    const m = await this.prisma.orgMember.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId } } })
    if (!m) throw new ForbiddenException('Not a member')
    return m
  }

  private slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
  }
}
