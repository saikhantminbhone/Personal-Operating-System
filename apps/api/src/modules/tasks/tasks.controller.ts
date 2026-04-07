import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { TasksService } from './tasks.service'
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'goalId', required: false })
  @ApiQuery({ name: 'energyLevel', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('goalId') goalId?: string,
    @Query('energyLevel') energyLevel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasks.findAll(user.id, {
      status,
      priority,
      goalId,
      energyLevel: energyLevel !== undefined ? parseInt(energyLevel, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
  }

  @Get('focus-queue')
  @ApiOperation({ summary: 'Get energy-matched focus queue for today' })
  @ApiQuery({ name: 'energyLevel', required: false, type: Number })
  getFocusQueue(@CurrentUser() user: any, @Query('energyLevel') energyLevel?: string) {
    return this.tasks.findTodayFocusQueue(user.id, energyLevel !== undefined ? parseInt(energyLevel, 10) : undefined)
  }

  @Get('stats/today')
  @ApiOperation({ summary: 'Get today task stats' })
  getTodayStats(@CurrentUser() user: any) {
    return this.tasks.getTodayStats(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasks.findOne(user.id, id)
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.id, dto)
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(user.id, id, dto)
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark task as done' })
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasks.complete(user.id, id)
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasks.delete(user.id, id)
  }
}
