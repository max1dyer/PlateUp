import { Quantity } from '../grocery-list/grocery-list.models';
import { StockLevel, StockStatus } from '../pantry/pantry.models';
import { RecipeIngredient } from './recipe.models';

/** One ingredient row on the recipe page: the amount needed and what the pantry holds of it. */
export interface IngredientStock {
  name: string;
  /** The amount needed at the chosen servings. */
  quantity: Quantity;
  /** The pantry's amount in the same unit, or null if it has none that compares. */
  onHand: Quantity | null;
  /** The pantry's amount in its own unit (shown when it can't be compared), or null. */
  held: Quantity | null;
  status: StockStatus;
  /** How much of the needed amount is on hand, from 0 to 100 (%). */
  percent: number;
  /** Estimated cost of the full amount, in US dollars. */
  cost: number;
  /** Estimated cost of only what the pantry is missing (the full cost if it can't be compared). */
  missingCost: number;
}

/** Rounds to whole cents. */
function toCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

/**
 * Pairs each (already scaled) ingredient with the pantry's stock level for it (issue #38).
 * `levels` come from `POST /pantry/stock-check` for the same ingredients in the same order; the
 * pantry amount is already in the ingredient's unit, so the status is recomputed here as the
 * servings change. Without levels (not loaded, or the pantry failed to load) every ingredient
 * counts as missing.
 */
export function stockRows(
  ingredients: readonly RecipeIngredient[],
  levels: readonly StockLevel[] | null,
): IngredientStock[] {
  return ingredients.map((ingredient, index) => {
    const level = levels?.[index];
    const needed = ingredient.quantity;
    const cost = ingredient.estimatedCost ?? 0;
    const onHand = level?.onHand ?? null;
    const held = level?.held ?? null;
    const base = { name: ingredient.name, quantity: needed, onHand, held, cost };
    if (level?.status === 'unknown') {
      // The pantry has some in another unit; the backend can't subtract it, so the full amount
      // would be bought.
      return { ...base, status: 'unknown', percent: 0, missingCost: cost };
    }
    if (onHand === null || onHand.amount <= 0) {
      return { ...base, status: 'missing', percent: 0, missingCost: cost };
    }
    if (needed.amount <= 0 || onHand.amount >= needed.amount) {
      return { ...base, status: 'enough', percent: 100, missingCost: 0 };
    }
    const share = onHand.amount / needed.amount;
    return {
      ...base,
      status: 'partial',
      percent: Math.round(share * 100),
      missingCost: toCents(cost * (1 - share)),
    };
  });
}

/**
 * The ingredients ticked by default for the grocery list: everything the pantry doesn't fully
 * cover. Ones held in a unit that can't be compared are left unticked, as before (the user
 * probably has them).
 */
export function defaultSelection(rows: readonly IngredientStock[]): Set<string> {
  return new Set(
    rows.filter((row) => row.status === 'missing' || row.status === 'partial').map((r) => r.name),
  );
}
