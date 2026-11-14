import { Nutrition } from '../recipes/recipe.models';

/** Mirrors the backend `MealSlot` enum values. */
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** Meal times in display order, with their labels. */
export const MEAL_SLOTS: readonly { value: MealSlot; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
  { value: 'dinner', label: 'Dinner' },
];

/** Most servings one planned meal can have (enforced by the backend's `PlannedMeal`). */
export const MAX_PLANNED_SERVINGS = 50;

/** The parts of a recipe the planner shows beside a planned meal. */
export interface PlannedRecipe {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  /** Servings the recipe is written for. */
  servings: number;
  prepTimeMinutes: number;
  /** Nutrition for one serving. */
  nutrition: Nutrition;
}

/** A recipe planned for a day and meal time, as returned by `GET /planner/meals`. */
export interface PlannedMeal {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  recipeId: string;
  /** The planned day (`YYYY-MM-DD`). */
  date: string;
  slot: MealSlot;
  /** Servings to cook. */
  servings: number;
  /** True once the user has marked it as eaten. */
  eaten: boolean;
  recipe: PlannedRecipe;
}

/** Body of `POST /planner/meals`; without `servings` the preferred serving size is used. */
export interface NewPlannedMeal {
  recipeId: string;
  date: string;
  slot: MealSlot;
  servings?: number;
}

/** Body of `PATCH /planner/meals/:mealId`; omitted fields stay unchanged. */
export interface PlannedMealChanges {
  date?: string;
  slot?: MealSlot;
  servings?: number;
  eaten?: boolean;
}
