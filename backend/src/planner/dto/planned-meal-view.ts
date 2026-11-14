import { EntityJson } from '../../common/domain/base.entity';
import { NutritionInfo } from '../../recipes/entities/recipe.entity';
import { PlannedMealSnapshot } from '../entities/planned-meal.entity';

/** The parts of a recipe the planner shows beside a planned meal. */
export interface PlannedRecipeSummary {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  /** Servings the recipe is written for (its nutrition is per serving). */
  servings: number;
  prepTimeMinutes: number;
  nutrition: NutritionInfo;
}

/**
 * Response shape for planner routes: a planned meal with a summary of its
 * recipe, so the planner can show a week without loading each recipe.
 */
export type PlannedMealView = EntityJson & PlannedMealSnapshot & { recipe: PlannedRecipeSummary };
