import { asJson, storeAndRestore } from '../../common/testing/store-and-restore';
import { DietaryRestriction } from '../../common/domain/dietary-restriction';
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
    costPerServing: null,
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

  it('reports which ingredients break which dietary restrictions', () => {
    const recipe = new Recipe(
      'author',
      details({
        ingredients: [
          new RecipeIngredient('Oats', new Quantity(1, Unit.Cup)),
          new RecipeIngredient('Milk', new Quantity(1, Unit.Cup)),
        ],
      }),
    );

    expect(recipe.toJSON().dietaryConflicts[DietaryRestriction.DairyFree]).toEqual(['Milk']);
    expect(recipe.suits([DietaryRestriction.Vegetarian])).toBe(true);
    expect(recipe.suits([DietaryRestriction.Vegetarian, DietaryRestriction.DairyFree])).toBe(false);
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

  it('accepts a photo as a web address or uploaded image, and rejects anything else', () => {
    expect(new Recipe('author', details({ thumbnailUrl: ' ' })).toJSON().thumbnailUrl).toBeNull();
    expect(
      new Recipe('author', details({ thumbnailUrl: 'https://example.com/oats.jpg' })).toJSON()
        .thumbnailUrl,
    ).toBe('https://example.com/oats.jpg');
    expect(() => new Recipe('author', details({ thumbnailUrl: 'not a url' }))).toThrow(
      DomainValidationError,
    );
  });

  it('estimates the cost per serving from ingredient prices when the author gives none', () => {
    // 1 cup of oats is about 237 g at $4/kg, so about $0.95, split over 2 servings (rounded up to $0.48).
    const recipe = new Recipe('author', details());

    expect(recipe.estimatedCostPerServing).toBe(0.48);
    expect(recipe.toJSON()).toMatchObject({ estimatedCostPerServing: 0.48, costIsEstimate: true });
  });

  it("uses the author's cost per serving, rounded to the cent, instead of the estimate", () => {
    const recipe = new Recipe('author', details({ costPerServing: 2.499 }));

    expect(recipe.toJSON()).toMatchObject({ estimatedCostPerServing: 2.5, costIsEstimate: false });
    recipe.update({ costPerServing: null });
    expect(recipe.toJSON().costIsEstimate).toBe(true);
    expect(() => new Recipe('author', details({ costPerServing: -1 }))).toThrow(
      DomainValidationError,
    );
  });

  it('fits a budget when one serving costs no more than the limit', () => {
    const recipe = new Recipe('author', details({ costPerServing: 3 }));

    expect(recipe.fitsBudget(3)).toBe(true);
    expect(recipe.fitsBudget(2.99)).toBe(false);
  });

  describe('storage record', () => {
    it('restores an equal recipe, including reviews, shares, id, and timestamps', () => {
      const recipe = new Recipe('author', details({ visibility: RecipeVisibility.Private }));
      recipe.review('alice', 4, 'Tasty');
      recipe.shareWith('bob');

      const restored = storeAndRestore(recipe, Recipe.fromRecord);

      expect(asJson(restored)).toEqual(asJson(recipe));
      expect(restored.toRecord()).toEqual(recipe.toRecord());
      expect(restored.updatedAt).toEqual(recipe.updatedAt);
      expect(restored.isVisibleTo('bob')).toBe(true);
      expect(restored.reviews[0].reviewedAt).toEqual(recipe.reviews[0].reviewedAt);
    });

    it('keeps rules working on the restored copy', () => {
      const restored = storeAndRestore(new Recipe('author', details()), Recipe.fromRecord);

      expect(restored.ingredientsFor(4)[0].quantity.equals(new Quantity(2, Unit.Cup))).toBe(true);
      expect(() => restored.review('author', 5, '')).toThrow(DomainValidationError);
    });

    it('rejects a stored record that breaks a rule', () => {
      const record = new Recipe('author', details()).toRecord();
      record.details.ingredients = [];

      expect(() => Recipe.fromRecord(record)).toThrow(DomainValidationError);
    });
  });
});
