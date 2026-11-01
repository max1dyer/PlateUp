import { Recipe, RecipeReview } from './recipe.models';

/** Test data shaped like the backend's JSON. */
export function recipeReview(overrides: Partial<RecipeReview> = {}): RecipeReview {
  return {
    reviewerId: 'reviewer-1',
    rating: 5,
    comment: 'Great',
    reviewedAt: '2026-10-28T00:00:00.000Z',
    ...overrides,
  };
}

export function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
    authorId: 'author-1',
    title: 'Chicken and Rice',
    description: 'High-protein meal prep staple.',
    thumbnailUrl: null,
    visibility: 'public',
    servings: 2,
    prepTimeMinutes: 30,
    nutrition: { calories: 550, protein: 45, fat: 10, carbohydrates: 60 },
    tags: ['High Protein'],
    ingredients: [
      { name: 'Chicken breast', quantity: { amount: 1.5, unit: 'lb' } },
      { name: 'Rice', quantity: { amount: 1, unit: 'cup' } },
    ],
    steps: ['Cook the rice.', 'Grill the chicken.'],
    rating: null,
    numRatings: 0,
    reviews: [],
    ...overrides,
  };
}
