import { IngredientCategory, guessCategory } from './ingredient-category';

describe('guessCategory', () => {
  it.each([
    ['Chicken thighs', IngredientCategory.Protein],
    ['Long-grain rice', IngredientCategory.Carbs],
    ['Butter', IngredientCategory.Dairy],
    ['Peanut butter', IngredientCategory.Snacks],
    ['Garlic cloves', IngredientCategory.Produce],
    ['Eggplant', IngredientCategory.Produce],
    ['Olive oil', IngredientCategory.OilSauce],
    ['Chicken broth', IngredientCategory.OilSauce],
    ['Frozen peas', IngredientCategory.Frozen],
    ['Smoked paprika', IngredientCategory.Spices],
    ['All-purpose flour', IngredientCategory.Baking],
  ])('puts %s in %s', (name, category) => {
    expect(guessCategory(name)).toBe(category);
  });

  it('falls back to Other for unknown ingredients', () => {
    expect(guessCategory('Mystery item')).toBe(IngredientCategory.Other);
  });
});
