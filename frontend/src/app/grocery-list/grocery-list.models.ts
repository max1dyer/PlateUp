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

export interface Quantity {
  amount: number;
  unit: Unit;
}

export interface GroceryListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  quantity: Quantity | null;
  category: IngredientCategory;
  purchased: boolean;
}

export interface GroceryList {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  name: string;
  items: GroceryListItem[];
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
