import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { GoalsService } from './goals.service'
import { CreateGoalDto, UpdateGoalDto, CreateKeyResultDto, UpdateKeyResultDto } from './goals.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private goals: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all goals' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'pillar', required: false })
  findAll(@CurrentUser() user: any, @Query('status') status?: string, @Query('pillar') pillar?: string) {
    return this.goals.findAll(user.id, status, pillar)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID with key results and tasks' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goals.findOne(user.id, id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  create(@CurrentUser() user: any, @Body() dto: CreateGoalDto) {
    return this.goals.create(user.id, dto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goals.update(user.id, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal (soft delete)' })
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goals.delete(user.id, id)
  }

  // Key Results
  @Post(':goalId/key-results')
  @ApiOperation({ summary: 'Add key result to goal' })
  addKR(@CurrentUser() user: any, @Param('goalId') goalId: string, @Body() dto: CreateKeyResultDto) {
    return this.goals.addKeyResult(user.id, goalId, dto)
  }

  @Patch(':goalId/key-results/:krId')
  @ApiOperation({ summary: 'Update key result (progress)' })
  updateKR(@CurrentUser() user: any, @Param('goalId') goalId: string, @Param('krId') krId: string, @Body() dto: UpdateKeyResultDto) {
    return this.goals.updateKeyResult(user.id, goalId, krId, dto)
  }

  @Delete(':goalId/key-results/:krId')
  @ApiOperation({ summary: 'Delete key result' })
  deleteKR(@CurrentUser() user: any, @Param('goalId') goalId: string, @Param('krId') krId: string) {
    return this.goals.deleteKeyResult(user.id, goalId, krId)
  }
}
