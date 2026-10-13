import { Unit } from '../../common/domain/quantity';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { RecipeVisibility } from '../entities/recipe.entity';

/** A valid two-serving recipe for tests; override any field as needed. */
export function buildCreateRecipeDto(overrides: Partial<CreateRecipeDto> = {}): CreateRecipeDto {
  return {
    title: 'Chicken and Rice',
    description: 'High-protein meal prep staple.',
    servings: 2,
    prepTimeMinutes: 30,
    ingredients: [
      { name: 'Chicken breast', quantity: { amount: 400, unit: Unit.Gram } },
      { name: 'Rice', quantity: { amount: 1, unit: Unit.Cup } },
    ],
    steps: ['Cook the rice.', 'Grill the chicken.'],
    nutrition: { calories: 550, protein: 45, fat: 10, carbohydrates: 60 },
    visibility: RecipeVisibility.Public,
    ...overrides,
  };
}
