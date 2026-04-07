import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { HabitsService } from './habits.service'
import { CreateHabitDto, UpdateHabitDto, LogHabitDto } from './habits.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Habits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private habits: HabitsService) {}

  @Get() findAll(@CurrentUser() u: any) { return this.habits.findAll(u.id) }
  @Get('today') getToday(@CurrentUser() u: any) { return this.habits.getTodaySummary(u.id) }
  @Get('weekly') getWeekly(@CurrentUser() u: any) { return this.habits.getWeeklyStats(u.id) }
  @Get(':id') findOne(@CurrentUser() u: any, @Param('id') id: string) { return this.habits.findOne(u.id, id) }
  @Post() create(@CurrentUser() u: any, @Body() dto: CreateHabitDto) { return this.habits.create(u.id, dto) }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: UpdateHabitDto) { return this.habits.update(u.id, id, dto) }
  @Delete(':id') archive(@CurrentUser() u: any, @Param('id') id: string) { return this.habits.archive(u.id, id) }
  @Post(':id/log') @ApiOperation({ summary: 'Log habit completion' }) log(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: LogHabitDto) { return this.habits.log(u.id, id, dto) }
  @Delete(':id/log/:logId') unlog(@CurrentUser() u: any, @Param('id') id: string, @Param('logId') logId: string) { return this.habits.unlog(u.id, id, logId) }
}
