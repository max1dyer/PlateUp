import { HttpErrorResponse } from '@angular/common/http';
import {
  CATEGORIES,
  GroceryListItem,
  IngredientCategory,
  Quantity,
  Unit,
} from './grocery-list.models';

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
  const unit = quantity.amount > 1 ? (PLURALS[quantity.unit] ?? quantity.unit) : quantity.unit;
  return `${amount} ${unit}`;
}

function formatAmount(amount: number): string {
  const whole = Math.floor(amount);
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

/** The backend's error message if it sent one, otherwise a general one. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
    return error.error.message;
  }
  return 'Something went wrong. Please try again.';
}
