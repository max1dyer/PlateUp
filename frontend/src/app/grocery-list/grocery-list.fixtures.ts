import { GroceryList, GroceryListItem } from './grocery-list.models';

/** Test data shaped like the backend's JSON. */
export function groceryItem(overrides: Partial<GroceryListItem> = {}): GroceryListItem {
  return {
    id: 'item-1',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    name: 'Eggs',
    quantity: { amount: 1, unit: 'carton' },
    category: 'protein',
    purchased: false,
    ...overrides,
  };
}

export function groceryList(items: GroceryListItem[] = []): GroceryList {
  return {
    id: 'list-1',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    ownerId: 'demo-user',
    name: 'Grocery list',
    items,
  };
}
