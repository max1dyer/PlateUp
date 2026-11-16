import { MealSlot } from '../entities/planned-meal.entity';

/** Body of `POST /planner/meals`. */
export class PlanMealDto {
  public readonly recipeId!: string;
  /** The day to plan it for (`YYYY-MM-DD`). */
  public readonly date!: string;
  public readonly slot!: MealSlot;
  /** Defaults to the user's preferred serving size. */
  public readonly servings?: number;
}
