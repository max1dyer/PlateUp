import { isSameIngredient } from '../../common/domain/ingredient-name';
import { Quantity } from '../../common/domain/quantity';
import { PantryItem } from './pantry-item.entity';

/**
 * How the pantry compares with an amount of an ingredient:
 * - `enough`: the pantry holds at least the amount needed;
 * - `partial`: it holds some, but less than needed;
 * - `missing`: it holds none;
 * - `unknown`: it holds some in a unit that can't be compared (e.g. "1 bag" against "2 cups").
 */
export enum StockStatus {
  Enough = 'enough',
  Partial = 'partial',
  Missing = 'missing',
  Unknown = 'unknown',
}

/** An ingredient and amount to look up in the pantry. */
export interface StockNeed {
  name: string;
  quantity: Quantity;
}

/** What the pantry holds of one needed ingredient (issue #38). */
export interface StockLevel {
  name: string;
  needed: Quantity;
  /** The pantry's amount converted to the needed unit, or null if it has none comparable. */
  onHand: Quantity | null;
  /** The pantry's amount as stored (in its own unit), or null if it has none. */
  held: Quantity | null;
  status: StockStatus;
}

/**
 * Compares each need with the matching pantry item (names matched ignoring case and spacing; a
 * pantry keeps one item per ingredient). The pantry amount is converted into the need's unit so
 * the two can be shown side by side, e.g. "1/2 cup of 1 cup".
 */
export function checkStock(
  needs: readonly StockNeed[],
  pantry: readonly PantryItem[],
): StockLevel[] {
  return needs.map((need) => {
    const item = pantry.find((each) => isSameIngredient(each.name, need.name));
    if (!item) {
      return { ...base(need), held: null, onHand: null, status: StockStatus.Missing };
    }
    if (!item.quantity.isCompatibleWith(need.quantity)) {
      return { ...base(need), held: item.quantity, onHand: null, status: StockStatus.Unknown };
    }
    const onHand = item.quantity.convertTo(need.quantity.unit);
    return { ...base(need), held: item.quantity, onHand, status: statusOf(onHand, need.quantity) };
  });
}

/** The fields every stock level starts with. */
function base(need: StockNeed): Pick<StockLevel, 'name' | 'needed'> {
  return { name: need.name, needed: need.quantity };
}

/** Compares two amounts already in the same unit. */
function statusOf(onHand: Quantity, needed: Quantity): StockStatus {
  if (onHand.amount >= needed.amount) {
    return StockStatus.Enough;
  }
  return onHand.amount > 0 ? StockStatus.Partial : StockStatus.Missing;
}
