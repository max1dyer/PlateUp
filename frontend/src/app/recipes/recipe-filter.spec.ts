import { recipe } from './recipe.fixtures';
import { RecipeSort, filterRecipes, sortRecipes, tagsOf } from './recipe-filter';

describe('recipe filters', () => {
  const chicken = recipe({ id: 'r1', title: 'Chicken and Rice', tags: ['High Protein'] });
  const oats = recipe({
    id: 'r2',
    title: 'Oats',
    tags: ['Breakfast', 'high protein'],
    ingredients: [{ name: 'Rolled oats', quantity: { amount: 1, unit: 'cup' } }],
  });

  it('tagsOf lists each tag once, ignoring case, sorted', () => {
    expect(tagsOf([chicken, oats])).toEqual(['Breakfast', 'High Protein']);
  });

  it('filterRecipes matches title, tags, and ingredients, ignoring case', () => {
    expect(filterRecipes([chicken, oats], 'ROLLED', null)).toEqual([oats]);
    expect(filterRecipes([chicken, oats], 'breakfast', null)).toEqual([oats]);
    expect(filterRecipes([chicken, oats], '  ', null)).toEqual([chicken, oats]);
  });

  describe('sortRecipes', () => {
    const quick = recipe({
      id: 'quick',
      createdAt: '2026-11-01T00:00:00.000Z',
      prepTimeMinutes: 5,
      rating: 3,
      numRatings: 10,
      nutrition: { calories: 200, protein: 5, fat: 1, carbohydrates: 30 },
      steps: ['One'],
    });
    const hearty = recipe({
      id: 'hearty',
      createdAt: '2026-11-03T00:00:00.000Z',
      prepTimeMinutes: 60,
      rating: 4.5,
      numRatings: 2,
      nutrition: { calories: 800, protein: 50, fat: 20, carbohydrates: 70 },
      steps: ['One', 'Two', 'Three'],
    });
    const unrated = recipe({
      id: 'unrated',
      createdAt: '2026-11-02T00:00:00.000Z',
      prepTimeMinutes: 20,
      rating: null,
      numRatings: 0,
      nutrition: { calories: 500, protein: 20, fat: 10, carbohydrates: 50 },
      steps: ['One', 'Two'],
    });
    const all = [quick, hearty, unrated];
    const ids = (sort: RecipeSort): string[] => sortRecipes(all, sort).map((r) => r.id);

    it('sorts by each option', () => {
      expect(ids('newest')).toEqual(['hearty', 'unrated', 'quick']);
      expect(ids('rating')).toEqual(['hearty', 'quick', 'unrated']);
      expect(ids('popularity')).toEqual(['quick', 'hearty', 'unrated']);
      expect(ids('protein')).toEqual(['hearty', 'unrated', 'quick']);
      expect(ids('calories')).toEqual(['quick', 'unrated', 'hearty']);
      expect(ids('time')).toEqual(['quick', 'unrated', 'hearty']);
      expect(ids('steps')).toEqual(['quick', 'unrated', 'hearty']);
    });

    it('sorts by ingredient count and breaks ties newest first', () => {
      const one = [{ name: 'Salt', quantity: { amount: 1, unit: 'tsp' as const } }];
      const older = recipe({
        id: 'older',
        createdAt: '2026-01-01T00:00:00.000Z',
        ingredients: one,
      });
      const newer = recipe({
        id: 'newer',
        createdAt: '2026-02-01T00:00:00.000Z',
        ingredients: one,
      });
      const big = recipe({ id: 'big', ingredients: [...one, ...one, ...one] });

      expect(sortRecipes([big, older, newer], 'ingredients').map((r) => r.id)).toEqual([
        'newer',
        'older',
        'big',
      ]);
    });

    it('does not change the input array', () => {
      sortRecipes(all, 'time');
      expect(all.map((r) => r.id)).toEqual(['quick', 'hearty', 'unrated']);
    });
  });

  it('filterRecipes keeps only recipes with the chosen tag', () => {
    expect(filterRecipes([chicken, oats], '', 'High Protein')).toEqual([chicken, oats]);
    expect(filterRecipes([chicken, oats], 'chicken', 'Breakfast')).toEqual([]);
  });
});
