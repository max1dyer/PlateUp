import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { Notification } from '../entities/notification.entity';
import { NotificationRepository } from './notification.repository';

/** `NotificationRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryNotificationRepository
  extends InMemoryRepository<Notification>
  implements NotificationRepository
{
  public findByRecipient(recipientId: string): Promise<Notification[]> {
    return this.findWhere((notification) => notification.isOwnedBy(recipientId));
  }
}
