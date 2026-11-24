import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { PlannedMeal, PlannedMealRecord } from '../entities/planned-meal.entity';
import { PlannedMealRepository } from './planned-meal.repository';

/** `PlannedMealRepository` backed by PostgreSQL (the "planned-meals" collection in `entity_records`). */
@Injectable()
export class PostgresPlannedMealRepository
  extends PostgresRepository<PlannedMeal, PlannedMealRecord>
  implements PlannedMealRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'planned-meals', (record) => PlannedMeal.fromRecord(record));
  }

  /** The user's meals dated from `from` to `to`, inclusive. */
  public findByOwnerBetween(ownerId: string, from: string, to: string): Promise<PlannedMeal[]> {
    return this.findWhere((meal) => meal.isOwnedBy(ownerId) && meal.isBetween(from, to));
  }
}
