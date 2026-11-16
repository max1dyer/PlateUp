import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { PlannedMeal } from '../entities/planned-meal.entity';
import { PlannedMealRepository } from './planned-meal.repository';

/** `PlannedMealRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryPlannedMealRepository
  extends InMemoryRepository<PlannedMeal>
  implements PlannedMealRepository
{
  /** The user's meals planned from `from` to `to` (both inclusive). */
  public findByOwnerBetween(ownerId: string, from: string, to: string): Promise<PlannedMeal[]> {
    return this.findWhere((meal) => meal.isOwnedBy(ownerId) && meal.isBetween(from, to));
  }
}
