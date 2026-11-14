import { MealSlot } from '../entities/planned-meal.entity';

/** Body of `PATCH /planner/meals/:mealId`: move the meal, change servings, or mark it eaten. */
export class UpdatePlannedMealDto {
  public readonly date?: string;
  public readonly slot?: MealSlot;
  public readonly servings?: number;
  public readonly eaten?: boolean;
}
