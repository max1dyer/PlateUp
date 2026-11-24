import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { Notification, NotificationRecord } from '../entities/notification.entity';
import { NotificationRepository } from './notification.repository';

/** `NotificationRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryNotificationRepository
  extends InMemoryRepository<Notification, NotificationRecord>
  implements NotificationRepository
{
  /** Restores stored records with `Notification.fromRecord`. */
  constructor() {
    super((record) => Notification.fromRecord(record));
  }

  public findByRecipient(recipientId: string): Promise<Notification[]> {
    return this.findWhere((notification) => notification.isOwnedBy(recipientId));
  }
}
