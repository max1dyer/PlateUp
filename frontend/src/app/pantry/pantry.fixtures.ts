import { PantryItem } from './pantry.models';

/** Test data shaped like the backend's JSON. */
export function pantryItem(overrides: Partial<PantryItem> = {}): PantryItem {
  return {
    id: 'item-1',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
    ownerId: 'user-1',
    name: 'Eggs',
    quantity: { amount: 12, unit: 'piece' },
    ...overrides,
  };
}
