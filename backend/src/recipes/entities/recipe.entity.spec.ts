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
    tags: ['Breakfast'],
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

    expect(json).toMatchObject({
      authorId: 'author',
      title: 'Oatmeal',
      servings: 2,
      tags: ['Breakfast'],
      rating: null,
      numRatings: 0,
      reviews: [],
    });
    expect(typeof json.id).toBe('string');
  });

  it('trims tags and drops case-insensitive duplicates', () => {
    const tags = [' Italian ', 'italian', 'Comfort Food'];

    const recipe = new Recipe('author', details({ tags }));

    expect(recipe.tags).toEqual(['Italian', 'Comfort Food']);
  });

  it('rejects a blank tag', () => {
    expect(() => new Recipe('author', details({ tags: ['  '] }))).toThrow(DomainValidationError);
  });

  it('review recalculates the average rating to one decimal place', () => {
    const recipe = new Recipe('author', details());

    recipe.review('alice', 4, 'Tasty');
    recipe.review('bob', 5, '');
    recipe.review('carol', 4, '');

    expect(recipe.numRatings).toBe(3);
    expect(recipe.averageRating).toBe(4.3);
  });

  it('a second review by the same user replaces the first', () => {
    const recipe = new Recipe('author', details());

    recipe.review('alice', 2, 'Bland');
    recipe.review('alice', 5, 'Better with salt');

    expect(recipe.numRatings).toBe(1);
    expect(recipe.reviews[0]).toMatchObject({ rating: 5, comment: 'Better with salt' });
  });

  it('review refuses the author and ratings outside 1 to 5', () => {
    const recipe = new Recipe('author', details());

    expect(() => recipe.review('author', 5, '')).toThrow(DomainValidationError);
    expect(() => recipe.review('alice', 0, '')).toThrow(DomainValidationError);
    expect(() => recipe.review('alice', 6, '')).toThrow(DomainValidationError);
    expect(() => recipe.review('alice', 3.5, '')).toThrow(DomainValidationError);
    expect(recipe.numRatings).toBe(0);
  });
});
