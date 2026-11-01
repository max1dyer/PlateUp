import { recipe } from './recipe.fixtures';
import { filterRecipes, tagsOf } from './recipe-filter';

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

  it('filterRecipes keeps only recipes with the chosen tag', () => {
    expect(filterRecipes([chicken, oats], '', 'High Protein')).toEqual([chicken, oats]);
    expect(filterRecipes([chicken, oats], 'chicken', 'Breakfast')).toEqual([]);
  });
});
