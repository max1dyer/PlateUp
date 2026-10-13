import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { Quantity, Unit } from '../../common/domain/quantity';
import { RecipeIngredient } from './recipe-ingredient';
import { Recipe, RecipeDetails, RecipeVisibility } from './recipe.entity';

function details(overrides: Partial<RecipeDetails> = {}): RecipeDetails {
  return {
    title: 'Oatmeal',
    description: '',
    thumbnailUrl: null,
    servings: 2,
    prepTimeMinutes: 5,
    ingredients: [new RecipeIngredient('Oats', new Quantity(1, Unit.Cup))],
    steps: ['Boil water.', 'Add oats.'],
    nutrition: { calories: 300, protein: 10, fat: 5, carbohydrates: 50 },
    visibility: RecipeVisibility.Public,
    ...overrides,
  };
}

describe('Recipe', () => {
  it('rejects a recipe with no ingredients', () => {
    expect(() => new Recipe('author', details({ ingredients: [] }))).toThrow(DomainValidationError);
  });

  it('rejects a non-integer serving count', () => {
    expect(() => new Recipe('author', details({ servings: 1.5 }))).toThrow(DomainValidationError);
  });

  it('ingredientsFor scales quantities to the requested servings', () => {
    const recipe = new Recipe('author', details());

    const [oats] = recipe.ingredientsFor(7);

    expect(oats.quantity.equals(new Quantity(3.5, Unit.Cup))).toBe(true);
  });

  it('private recipes are only visible to their author', () => {
    const recipe = new Recipe('author', details({ visibility: RecipeVisibility.Private }));

    expect(recipe.isVisibleTo('author')).toBe(true);
    expect(recipe.isVisibleTo('someone-else')).toBe(false);
  });

  it('update validates the merged result and keeps the original on failure', () => {
    const recipe = new Recipe('author', details());

    expect(() => recipe.update({ title: '   ' })).toThrow(DomainValidationError);
    expect(recipe.title).toBe('Oatmeal');

    recipe.update({ title: 'Overnight Oats' });
    expect(recipe.title).toBe('Overnight Oats');
  });

  it('serializes its fields through toJSON', () => {
    const json = new Recipe('author', details()).toJSON();

    expect(json).toMatchObject({ authorId: 'author', title: 'Oatmeal', servings: 2 });
    expect(typeof json.id).toBe('string');
  });
});
