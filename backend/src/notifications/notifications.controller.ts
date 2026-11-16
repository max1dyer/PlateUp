import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

/** HTTP routes under `/notifications` for the signed-in user's notifications. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** `GET /notifications`: the user's notifications, newest first. */
  @Get()
  public findAll(@CurrentUserId() userId: string): Promise<Notification[]> {
    return this.notificationsService.findAll(userId);
  }

  /** `POST /notifications/:notificationId/read`: marks one as read. */
  @Post(':notificationId/read')
  @HttpCode(200)
  public markRead(
    @CurrentUserId() userId: string,
    @Param('notificationId') notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markRead(userId, notificationId);
  }
}
