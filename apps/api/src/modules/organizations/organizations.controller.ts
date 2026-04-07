import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { OrganizationsService } from './organizations.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgs: OrganizationsService) {}

  @Get()    mine(@CurrentUser() u: any) { return this.orgs.findMyOrgs(u.id) }
  @Post()   create(@CurrentUser() u: any, @Body() dto: any) { return this.orgs.create(u.id, dto) }
  @Get(':id')    findOne(@CurrentUser() u: any, @Param('id') id: string) { return this.orgs.findOne(u.id, id) }
  @Patch(':id')  update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.orgs.update(u.id, id, dto) }
  @Delete(':id') delete(@CurrentUser() u: any, @Param('id') id: string) { return this.orgs.delete(u.id, id) }
  @Get(':id/members')  getMembers(@CurrentUser() u: any, @Param('id') id: string) { return this.orgs.getMembers(u.id, id) }
  @Post(':id/invite')  invite(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: { email: string; role?: string }) { return this.orgs.inviteMember(u.id, id, dto.email, dto.role) }
  @Delete(':id/members/:mid') remove(@CurrentUser() u: any, @Param('id') id: string, @Param('mid') mid: string) { return this.orgs.removeMember(u.id, id, mid) }
  @Post(':id/leave')   leave(@CurrentUser() u: any, @Param('id') id: string) { return this.orgs.leaveOrg(u.id, id) }
  @Get(':id/stats')    stats(@CurrentUser() u: any, @Param('id') id: string) { return this.orgs.getStats(u.id, id) }
  @Post('invites/:token/accept') accept(@CurrentUser() u: any, @Param('token') t: string) { return this.orgs.acceptInvite(u.id, t) }
}
