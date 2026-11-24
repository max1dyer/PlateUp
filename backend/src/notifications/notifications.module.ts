import { repositoryProvider, StorageModule } from '../common/persistence/storage.module';
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from './repositories/notification.repository';
import { PostgresNotificationRepository } from './repositories/postgres-notification.repository';
import { InMemoryNotificationRepository } from './repositories/in-memory-notification.repository';

/** Generic notifications feature; other modules import it to send notifications. */
@Module({
  imports: [StorageModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    repositoryProvider(
      NotificationRepository,
      InMemoryNotificationRepository,
      PostgresNotificationRepository,
    ),
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
