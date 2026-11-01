import { isSameIngredient } from './ingredient-name';

describe('isSameIngredient', () => {
  it('ignores case and extra spaces', () => {
    expect(isSameIngredient('Eggs', ' eggs ')).toBe(true);
    expect(isSameIngredient('Red  curry paste', 'red curry PASTE')).toBe(true);
  });

  it('treats different names, including plurals, as different ingredients', () => {
    expect(isSameIngredient('Egg', 'Eggs')).toBe(false);
    expect(isSameIngredient('Milk', 'Oat milk')).toBe(false);
  });

  it('never matches blank names', () => {
    expect(isSameIngredient('', '')).toBe(false);
    expect(isSameIngredient('  ', ' ')).toBe(false);
  });
});
