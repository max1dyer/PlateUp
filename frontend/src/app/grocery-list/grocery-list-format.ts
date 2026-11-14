import {
  CATEGORIES,
  GroceryListItem,
  IngredientCategory,
  Quantity,
  Unit,
} from './grocery-list.models';

/** One store section of the grocery list and the items in it. */
export interface CategoryGroup {
  category: IngredientCategory;
  label: string;
  items: GroceryListItem[];
}

/** Common fractions shown instead of decimals ("1/2 lb"). Amounts are stored to 2 decimals. */
const FRACTIONS: readonly [number, string][] = [
  [0.25, '1/4'],
  [0.33, '1/3'],
  [0.5, '1/2'],
  [0.67, '2/3'],
  [0.75, '3/4'],
];

/** Units written in the plural when there is more than one ("2 cartons"). */
const PLURALS: Partial<Record<Unit, string>> = {
  cup: 'cups',
  carton: 'cartons',
  bag: 'bags',
  bottle: 'bottles',
  tube: 'tubes',
  can: 'cans',
  jar: 'jars',
  box: 'boxes',
};

/** Groups items by category in display order, leaving out empty categories. */
export function groupByCategory(items: readonly GroceryListItem[]): CategoryGroup[] {
  return CATEGORIES.map(({ value, label }) => ({
    category: value,
    label,
    items: items.filter((item) => item.category === value),
  })).filter((group) => group.items.length > 0);
}

/** "3 lb", "1 carton", "2 bags", "1/2 lb", "1 1/2 cups"; pieces as a bare number ("1"). */
export function formatQuantity(quantity: Quantity | null): string {
  if (quantity === null) {
    return '';
  }
  const amount = formatAmount(quantity.amount);
  if (quantity.unit === 'piece') {
    return amount;
  }
  // Only units listed in `PLURALS` change form; others ("g", "lb") read the same either way.
  const unit = quantity.amount > 1 ? (PLURALS[quantity.unit] ?? quantity.unit) : quantity.unit;
  return `${amount} ${unit}`;
}

/** `quantity` multiplied by `factor` (e.g. new servings / recipe servings), to two decimals. */
export function scaleQuantity(quantity: Quantity, factor: number): Quantity {
  return { amount: Math.round(quantity.amount * factor * 100) / 100, unit: quantity.unit };
}

/**
 * Writes an amount as a whole number, a mixed fraction ("1 1/2"), or a decimal when no common
 * fraction fits.
 */
function formatAmount(amount: number): string {
  const whole = Math.floor(amount);
  // Round the fractional part to two decimals so it can be matched against `FRACTIONS`.
  const remainder = Math.round((amount - whole) * 100) / 100;
  if (remainder === 0) {
    return String(whole);
  }
  const fraction = FRACTIONS.find(([value]) => value === remainder)?.[1];
  if (!fraction) {
    return String(amount);
  }
  return whole === 0 ? fraction : `${whole} ${fraction}`;
}

/**
 * Same rule as the backend's `isSameIngredient`: names match ignoring case and
 * extra spaces ("eggs " = "Eggs"), so the UI agrees with what the server merges.
 */
export function isSameIngredient(a: string, b: string): boolean {
  const first = normalizeName(a);
  return first.length > 0 && first === normalizeName(b);
}

/** Lower-cases, trims, and collapses runs of whitespace. */
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
