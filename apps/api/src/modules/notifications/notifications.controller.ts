import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get() getAll(@CurrentUser() u: any, @Query('limit') limit?: number) { return this.notifications.getNotifications(u.id, limit) }
  @Get('unread-count') getUnreadCount(@CurrentUser() u: any) { return this.notifications.getUnreadCount(u.id) }
  @Post(':id/read') markRead(@CurrentUser() u: any, @Param('id') id: string) { return this.notifications.markRead(u.id, id) }
  @Post('read-all') markAllRead(@CurrentUser() u: any) { return this.notifications.markAllRead(u.id) }
  @Delete(':id') delete(@CurrentUser() u: any, @Param('id') id: string) { return this.notifications.deleteNotification(u.id, id) }
}
