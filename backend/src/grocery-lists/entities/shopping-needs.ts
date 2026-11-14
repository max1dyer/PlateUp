import { isSameIngredient } from '../../common/domain/ingredient-name';
import { Quantity } from '../../common/domain/quantity';

/** An amount of one ingredient that some planned meal needs. */
export interface IngredientNeed {
  name: string;
  quantity: Quantity;
}

/** An ingredient left off the grocery list, and why. */
export interface SkippedNeed {
  name: string;
  reason: string;
}

/** The result of combining needs: one entry per ingredient, plus any that couldn't be combined. */
export interface CombinedNeeds {
  needs: IngredientNeed[];
  skipped: SkippedNeed[];
}

/** What still has to be bought once the pantry is taken into account (UC6). */
export interface Shortfall {
  /** Amounts still to buy, one per ingredient. */
  toBuy: IngredientNeed[];
  /** Names of ingredients the pantry already holds enough of. */
  covered: string[];
}

/**
 * Merges the ingredients of several meals into one need per ingredient
 * (names matched ignoring case and spacing), adding up amounts in compatible
 * units in the first one's unit. An amount in a unit that can't be combined
 * with the first (e.g. "2 cloves" and "1 tbsp" of garlic) is left out and
 * reported, since a grocery list holds one line per ingredient.
 */
export function combineNeeds(needs: readonly IngredientNeed[]): CombinedNeeds {
  const combined: IngredientNeed[] = [];
  const skipped: SkippedNeed[] = [];
  for (const need of needs) {
    const index = combined.findIndex((each) => isSameIngredient(each.name, need.name));
    if (index === -1) {
      combined.push({ ...need });
      continue;
    }
    const existing = combined[index];
    if (existing.quantity.isCompatibleWith(need.quantity)) {
      combined[index] = { name: existing.name, quantity: existing.quantity.plus(need.quantity) };
    } else {
      skipped.push({
        name: need.name,
        reason:
          `${need.name} is needed in ${need.quantity.unit} and ${existing.quantity.unit}, ` +
          `which can't be combined; ${need.quantity.amount} ${need.quantity.unit} was left off.`,
      });
    }
  }
  return { needs: combined, skipped };
}

/** The pantry stock `shortfall` compares against: a name and the amount on hand. */
export interface StockOnHand {
  name: string;
  quantity: Quantity;
}

/**
 * Takes what the pantry already holds away from each need. A need the pantry
 * fully covers is reported as covered; a partly covered one keeps only the
 * remainder. Pantry stock in a unit that can't be compared (e.g. "1 bag" of
 * rice against "2 cups") is ignored, so the full amount is still bought.
 */
export function shortfall(
  needs: readonly IngredientNeed[],
  stock: readonly StockOnHand[],
): Shortfall {
  const toBuy: IngredientNeed[] = [];
  const covered: string[] = [];
  for (const need of needs) {
    const held = stock.find(
      (item) =>
        isSameIngredient(item.name, need.name) && item.quantity.isCompatibleWith(need.quantity),
    );
    const remaining = held ? need.quantity.minus(held.quantity) : need.quantity;
    if (remaining.amount === 0) {
      covered.push(need.name);
    } else {
      toBuy.push({ name: need.name, quantity: remaining });
    }
  }
  return { toBuy, covered };
}
