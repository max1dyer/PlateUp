import { recipe, recipeReview } from './recipe.fixtures';
import {
  NO_RANGES,
  RecipeSort,
  activeRangeCount,
  filterByBudget,
  filterByRanges,
  filterRecipes,
  isOverBudget,
  sortRecipes,
  tagsOf,
  trendingScore,
} from './recipe-filter';

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
      estimatedCostPerServing: 1.5,
    });
    const hearty = recipe({
      id: 'hearty',
      createdAt: '2026-11-03T00:00:00.000Z',
      prepTimeMinutes: 60,
      rating: 4.5,
      numRatings: 2,
      nutrition: { calories: 800, protein: 50, fat: 20, carbohydrates: 70 },
      steps: ['One', 'Two', 'Three'],
      estimatedCostPerServing: 6,
    });
    const unrated = recipe({
      id: 'unrated',
      createdAt: '2026-11-02T00:00:00.000Z',
      prepTimeMinutes: 20,
      rating: null,
      numRatings: 0,
      nutrition: { calories: 500, protein: 20, fat: 10, carbohydrates: 50 },
      steps: ['One', 'Two'],
      estimatedCostPerServing: 3,
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
      expect(ids('fat')).toEqual(['quick', 'unrated', 'hearty']);
      expect(ids('carbs')).toEqual(['quick', 'unrated', 'hearty']);
      expect(ids('cost')).toEqual(['quick', 'unrated', 'hearty']);
    });

    it('reverses the order when asked, still breaking ties newest first', () => {
      expect(sortRecipes(all, 'cost', true).map((r) => r.id)).toEqual([
        'hearty',
        'unrated',
        'quick',
      ]);
      const twin = recipe({ ...quick, id: 'twin', createdAt: '2026-11-05T00:00:00.000Z' });
      expect(sortRecipes([quick, twin], 'cost', true).map((r) => r.id)).toEqual(['twin', 'quick']);
    });

    it('sorts trending recipes by recent, well-rated reviews and fresh uploads', () => {
      const now = new Date('2026-11-20T00:00:00.000Z');
      const old = '2026-09-01T00:00:00.000Z';
      const recentFive = recipe({
        id: 'recent-five',
        createdAt: old,
        reviews: [recipeReview({ rating: 5, reviewedAt: '2026-11-19T00:00:00.000Z' })],
      });
      const staleFive = recipe({
        id: 'stale-five',
        createdAt: old,
        reviews: [recipeReview({ rating: 5, reviewedAt: '2026-10-01T00:00:00.000Z' })],
      });
      const recentTwo = recipe({
        id: 'recent-two',
        createdAt: old,
        reviews: [recipeReview({ rating: 2, reviewedAt: '2026-11-19T00:00:00.000Z' })],
      });
      const brandNew = recipe({ id: 'brand-new', createdAt: '2026-11-20T00:00:00.000Z' });

      expect(trendingScore(brandNew, now)).toBe(1);
      expect(
        sortRecipes([staleFive, recentTwo, brandNew, recentFive], 'trending', false, now).map(
          (r) => r.id,
        ),
      ).toEqual(['brand-new', 'recent-five', 'recent-two', 'stale-five']);
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

  it('filterByRanges keeps recipes inside every min and max, ends included', () => {
    const light = recipe({
      id: 'light',
      nutrition: { calories: 300, protein: 25, fat: 8, carbohydrates: 20 },
      steps: ['One'],
    });
    const heavy = recipe({
      id: 'heavy',
      nutrition: { calories: 900, protein: 40, fat: 35, carbohydrates: 90 },
      steps: ['One', 'Two', 'Three', 'Four'],
    });
    const ranges = (changes: Partial<typeof NO_RANGES>) => ({ ...NO_RANGES, ...changes });

    expect(filterByRanges([light, heavy], NO_RANGES)).toEqual([light, heavy]);
    expect(filterByRanges([light, heavy], ranges({ calories: { min: null, max: 300 } }))).toEqual([
      light,
    ]);
    expect(filterByRanges([light, heavy], ranges({ protein: { min: 30, max: null } }))).toEqual([
      heavy,
    ]);
    expect(
      filterByRanges(
        [light, heavy],
        ranges({ fat: { min: 0, max: 10 }, carbohydrates: { min: 25, max: null } }),
      ),
    ).toEqual([]);
    expect(filterByRanges([light, heavy], ranges({ steps: { min: null, max: 3 } }))).toEqual([
      light,
    ]);
    expect(
      activeRangeCount(ranges({ fat: { min: 1, max: null }, steps: { min: 1, max: 2 } })),
    ).toBe(2);
  });

  it('filterByBudget hides recipes over the budget per serving, and keeps all without one', () => {
    const cheap = recipe({ id: 'cheap', estimatedCostPerServing: 2 });
    const pricey = recipe({ id: 'pricey', estimatedCostPerServing: 2.01 });

    expect(filterByBudget([cheap, pricey], 2)).toEqual([cheap]);
    expect(filterByBudget([cheap, pricey], null)).toEqual([cheap, pricey]);
    expect(isOverBudget(pricey, 2)).toBe(true);
    expect(isOverBudget(pricey, null)).toBe(false);
  });
});
