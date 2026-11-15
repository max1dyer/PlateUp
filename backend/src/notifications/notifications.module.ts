import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from './repositories/notification.repository';
import { InMemoryNotificationRepository } from './repositories/in-memory-notification.repository';

/** Generic notifications feature; other modules import it to send notifications. */
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: NotificationRepository, useClass: InMemoryNotificationRepository },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
