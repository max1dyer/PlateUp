import { Quantity } from '../grocery-list/grocery-list.models';
import { DietaryRestriction } from '../preferences/preferences.models';

/** One line of a recipe's ingredient list. */
export interface RecipeIngredient {
  name: string;
  quantity: Quantity;
  /** Estimated cost in US dollars of this amount (sent by the backend, ignored when saving). */
  estimatedCost?: number;
}

/** Nutrition for a single serving. */
export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

/** Most stars a review can give (mirrors the backend's `MAX_RATING`). */
export const MAX_STARS = 5;

/** One user's review of a recipe. */
export interface RecipeReview {
  reviewerId: string;
  /** Whole stars from 1 to 5. */
  rating: number;
  comment: string;
  reviewedAt: string;
}

/** A recipe as returned by the backend's `GET /recipes/:recipeId`. */
export interface Recipe {
  id: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  visibility: 'public' | 'private';
  servings: number;
  prepTimeMinutes: number;
  nutrition: Nutrition;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Average star rating, or null before the first review. */
  rating: number | null;
  numRatings: number;
  reviews: RecipeReview[];
  /** For each restriction the recipe breaks, the ingredients that break it (an estimate). */
  dietaryConflicts: Partial<Record<DietaryRestriction, string[]>>;
  /** The author's cost per serving in US dollars, or null when it is estimated. */
  costPerServing: number | null;
  /** Cost of one serving: the author's figure, or else the backend's ingredient estimate. */
  estimatedCostPerServing: number;
  /** True when `estimatedCostPerServing` is an estimate from ingredient prices. */
  costIsEstimate: boolean;
}

/** Body of `POST /recipes` (and, partially, `PATCH /recipes/:recipeId`). */
export interface NewRecipe {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  visibility: 'public' | 'private';
  servings: number;
  prepTimeMinutes: number;
  nutrition: Nutrition;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Dollars per serving; null means estimate it from the ingredients. */
  costPerServing: number | null;
}

/** Body of `PUT /recipes/:recipeId/reviews/me`. */
export interface NewReview {
  rating: number;
  comment: string;
}

/** A user a recipe is shared with, as returned by the `recipe-shares` routes. */
export interface SharedWithUser {
  id: string;
  username: string;
  displayName: string;
}
