import { ingredientCosts } from './recipe-cost';
import { recipe } from './recipe.fixtures';

describe('ingredientCosts', () => {
  // The fixture serves 2: chicken priced at $5.99 and rice at $0.71.

  it('scales the estimated ingredient prices to the servings', () => {
    expect(ingredientCosts(recipe(), 2)).toEqual([5.99, 0.71]);
    expect(ingredientCosts(recipe(), 4)).toEqual([11.98, 1.42]);
  });

  it("splits the author's cost per serving across the ingredients by their prices", () => {
    const priced = recipe({ costIsEstimate: false, costPerServing: 5, estimatedCostPerServing: 5 });

    // $5 a serving for 2 servings is $10, split 5.99 : 0.71.
    expect(ingredientCosts(priced, 2)).toEqual([8.94, 1.06]);
    // Changing the servings changes the total with it: $5 × 3 = $15.
    expect(ingredientCosts(priced, 3)).toEqual([13.41, 1.59]);
  });

  it("splits the author's cost evenly when no ingredient has a price", () => {
    const priced = recipe({
      costIsEstimate: false,
      costPerServing: 3,
      estimatedCostPerServing: 3,
      ingredients: [
        { name: 'Water', quantity: { amount: 1, unit: 'cup' }, estimatedCost: 0 },
        { name: 'Ice', quantity: { amount: 1, unit: 'cup' } },
      ],
    });

    expect(ingredientCosts(priced, 2)).toEqual([3, 3]);
  });
});
