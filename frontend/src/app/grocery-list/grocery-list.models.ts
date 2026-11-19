/** Mirrors the backend `Unit` enum values. */
export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'oz'
  | 'lb'
  | 'piece'
  | 'carton'
  | 'bag'
  | 'bottle'
  | 'tube'
  | 'can'
  | 'jar'
  | 'box';

/** Units in the order the unit dropdown offers them. */
export const UNITS: readonly Unit[] = [
  'piece',
  'carton',
  'bag',
  'bottle',
  'tube',
  'can',
  'jar',
  'box',
  'g',
  'kg',
  'oz',
  'lb',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'cup',
];

/** Mirrors the backend `IngredientCategory` enum values. */
export type IngredientCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'carbs'
  | 'baking'
  | 'oil-sauce'
  | 'spices'
  | 'frozen'
  | 'snacks'
  | 'drinks'
  | 'other';

/** Categories in display order (as in the Figma design), with their labels. */
export const CATEGORIES: readonly { value: IngredientCategory; label: string }[] = [
  { value: 'protein', label: 'Protein' },
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'carbs', label: 'Carbs' },
  { value: 'baking', label: 'Baking' },
  { value: 'oil-sauce', label: 'Oil/Sauce' },
  { value: 'spices', label: 'Spices' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'other', label: 'Other' },
];

/** An amount and unit, as the backend's `Quantity` value object serializes. */
export interface Quantity {
  amount: number;
  unit: Unit;
}

/** A user as shown on a shared list. */
export interface ListMember {
  id: string;
  name: string;
}

/** One recent change to a shared list, e.g. Sam "added Milk". */
export interface ListActivity {
  by: ListMember;
  message: string;
  at: string;
}

/** One line on a grocery list, as returned by the backend. */
export interface GroceryListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  quantity: Quantity | null;
  category: IngredientCategory;
  purchased: boolean;
  /** Who last added this item; null if unknown. */
  addedBy: ListMember | null;
  /** Estimated price in US dollars, or null when the item has no amount. */
  estimatedCost: number | null;
}

/** A grocery list with its items, as returned by `GET /grocery-lists`. */
export interface GroceryList {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  name: string;
  items: GroceryListItem[];
  /** Other users the owner shared the list with. */
  members: ListMember[];
  /** Recent changes to a shared list, newest first. */
  activity: ListActivity[];
  /** Estimated cost in US dollars of the items with an amount. */
  estimatedTotal: number;
}

/** Body of `POST /grocery-lists/:listId/items`. */
export interface NewGroceryItem {
  name: string;
  quantity?: Quantity;
  category?: IngredientCategory;
}

/** Body of `PATCH /grocery-lists/:listId/items/:itemId`; `quantity: null` removes it. */
export interface GroceryItemChanges {
  name?: string;
  quantity?: Quantity | null;
  category?: IngredientCategory;
  purchased?: boolean;
}

/** Response of `POST /grocery-lists/:listId/purchased-items/pantry`. */
export interface MoveToPantryResult {
  list: GroceryList;
  moved: string[];
  skipped: { name: string; reason: string }[];
}

/** Response of `POST /grocery-lists/:listId/planner-week` (UC6). */
export interface AddPlannerWeekResult {
  list: GroceryList;
  /** Names of the ingredients added to (or combined into) the list. */
  added: string[];
  /** Names of ingredients the pantry already holds enough of. */
  coveredByPantry: string[];
  /** Ingredients that could not be added, with the reason. */
  skipped: { name: string; reason: string }[];
}
