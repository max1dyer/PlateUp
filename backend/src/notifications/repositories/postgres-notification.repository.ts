import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { Notification, NotificationRecord } from '../entities/notification.entity';
import { NotificationRepository } from './notification.repository';

/** `NotificationRepository` backed by PostgreSQL (the "notifications" collection in `entity_records`). */
@Injectable()
export class PostgresNotificationRepository
  extends PostgresRepository<Notification, NotificationRecord>
  implements NotificationRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'notifications', (record) => Notification.fromRecord(record));
  }

  /** Every notification addressed to the given user. */
  public findByRecipient(recipientId: string): Promise<Notification[]> {
    return this.findWhere((notification) => notification.isOwnedBy(recipientId));
  }
}
