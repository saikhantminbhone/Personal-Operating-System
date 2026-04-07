import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats' })
  getDashboard(@CurrentUser() user: any) {
    return this.analytics.getDashboardStats(user.id)
  }

  @Get('goals/by-pillar')
  getGoalsByPillar(@CurrentUser() user: any) {
    return this.analytics.getGoalProgressByPillar(user.id)
  }

  @Get('productivity/trend')
  getTrend(@CurrentUser() user: any, @Query('days') days?: number) {
    return this.analytics.getProductivityTrend(user.id, days || 30)
  }

  @Get('habits/heatmap')
  getHeatmap(@CurrentUser() user: any) {
    return this.analytics.getHabitHeatmap(user.id)
  }
}
