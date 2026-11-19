import { Recipe } from './recipe.models';

/** Rounds to whole cents. */
function toCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

/**
 * The estimated cost of each ingredient (in recipe order) when making `servings` servings, in US
 * dollars. The costs always add up to the recipe's cost per serving × `servings` (give or take a
 * cent of rounding), so the grocery estimate agrees with the "per serving" figure on the page:
 *
 * - when the cost is estimated, these are the backend's ingredient prices, scaled to `servings`;
 * - when the author set a cost per serving, the ingredient prices are only used to split that
 *   cost between the ingredients (evenly if none of them has a price).
 */
export function ingredientCosts(recipe: Recipe, servings: number): number[] {
  const factor = servings / recipe.servings;
  const prices = recipe.ingredients.map((ingredient) => ingredient.estimatedCost ?? 0);
  if (recipe.costIsEstimate) {
    return prices.map((price) => toCents(price * factor));
  }
  const total = recipe.estimatedCostPerServing * servings;
  const sum = prices.reduce((all, price) => all + price, 0);
  return prices.map((price) =>
    toCents(sum > 0 ? (total * price) / sum : total / Math.max(1, prices.length)),
  );
}
