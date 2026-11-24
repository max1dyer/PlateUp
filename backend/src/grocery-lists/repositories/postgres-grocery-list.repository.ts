import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { GroceryList, GroceryListRecord } from '../entities/grocery-list.entity';
import { GroceryListRepository } from './grocery-list.repository';

/** `GroceryListRepository` backed by PostgreSQL (the "grocery-lists" collection in `entity_records`). */
@Injectable()
export class PostgresGroceryListRepository
  extends PostgresRepository<GroceryList, GroceryListRecord>
  implements GroceryListRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'grocery-lists', (record) => GroceryList.fromRecord(record));
  }

  /** Lists the user owns or was added to as a member. */
  public findAccessibleTo(userId: string): Promise<GroceryList[]> {
    return this.findWhere((list) => list.isAccessibleTo(userId));
  }
}
