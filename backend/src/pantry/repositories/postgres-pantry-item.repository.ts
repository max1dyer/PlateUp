import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { PantryItem, PantryItemRecord } from '../entities/pantry-item.entity';
import { PantryItemRepository } from './pantry-item.repository';

/** `PantryItemRepository` backed by PostgreSQL (the "pantry-items" collection in `entity_records`). */
@Injectable()
export class PostgresPantryItemRepository
  extends PostgresRepository<PantryItem, PantryItemRecord>
  implements PantryItemRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'pantry-items', (record) => PantryItem.fromRecord(record));
  }

  /** Every pantry item belonging to the given user. */
  public findByOwner(ownerId: string): Promise<PantryItem[]> {
    return this.findWhere((item) => item.isOwnedBy(ownerId));
  }
}
