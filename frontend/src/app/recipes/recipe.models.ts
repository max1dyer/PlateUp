import { Quantity } from '../grocery-list/grocery-list.models';
import { DietaryRestriction } from '../preferences/preferences.models';

/** One line of a recipe's ingredient list. */
export interface RecipeIngredient {
  name: string;
  quantity: Quantity;
}

/** Nutrition for a single serving. */
export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

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
}

/** Body of `PUT /recipes/:recipeId/reviews/me`. */
export interface NewReview {
  rating: number;
  comment: string;
}
