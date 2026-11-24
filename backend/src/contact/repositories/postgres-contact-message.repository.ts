import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { ContactMessage, ContactMessageRecord } from '../entities/contact-message.entity';
import { ContactMessageRepository } from './contact-message.repository';

/** `ContactMessageRepository` backed by PostgreSQL (the "contact-messages" collection in `entity_records`). */
@Injectable()
export class PostgresContactMessageRepository
  extends PostgresRepository<ContactMessage, ContactMessageRecord>
  implements ContactMessageRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'contact-messages', (record) => ContactMessage.fromRecord(record));
  }
}
