import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ProjectsService } from './projects.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get() findAll(@CurrentUser() u: any) { return this.projects.findAll(u.id) }
  @Get(':id') findOne(@CurrentUser() u: any, @Param('id') id: string) { return this.projects.findOne(u.id, id) }
  @Post() create(@CurrentUser() u: any, @Body() dto: any) { return this.projects.create(u.id, dto) }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.projects.update(u.id, id, dto) }
  @Delete(':id') delete(@CurrentUser() u: any, @Param('id') id: string) { return this.projects.delete(u.id, id) }
  @Post(':id/sprints') createSprint(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.projects.createSprint(u.id, id, dto) }
  @Get(':id/kanban') getKanban(@CurrentUser() u: any, @Param('id') id: string) { return this.projects.getKanban(u.id, id) }
}
