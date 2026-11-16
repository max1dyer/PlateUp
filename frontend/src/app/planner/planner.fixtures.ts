import { PlannedMeal } from './planner.models';

/** Test data shaped like the backend's JSON: two servings of a recipe for Monday lunch. */
export function plannedMeal(overrides: Partial<PlannedMeal> = {}): PlannedMeal {
  return {
    id: 'meal-1',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
    ownerId: 'user-1',
    recipeId: 'recipe-1',
    date: '2026-09-21',
    slot: 'lunch',
    servings: 2,
    eaten: false,
    recipe: {
      id: 'recipe-1',
      title: 'Chicken and Rice',
      thumbnailUrl: null,
      servings: 2,
      prepTimeMinutes: 30,
      nutrition: { calories: 550, protein: 45, fat: 10, carbohydrates: 60 },
    },
    ...overrides,
  };
}
