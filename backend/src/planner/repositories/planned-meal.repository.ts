import { Repository } from '../../common/persistence/repository';
import { PlannedMeal } from '../entities/planned-meal.entity';

/** DI token and contract for planner storage. */
export abstract class PlannedMealRepository extends Repository<PlannedMeal> {
  /** The user's meals planned from `from` to `to` (`YYYY-MM-DD`, both inclusive). */
  public abstract findByOwnerBetween(
    ownerId: string,
    from: string,
    to: string,
  ): Promise<PlannedMeal[]>;
}
