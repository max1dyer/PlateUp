import {
  GroceryListInviteNotification,
  GroceryListShareNotification,
  RecipeShareNotification,
  RecipeShareRevokedNotification,
} from './notification.models';

/** Fields shared by every fixture: an unread notification from Peter to Bob. */
const BASE = {
  id: 'n1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ownerId: 'bob',
  senderId: 'peter',
  status: 'pending',
  read: false,
} as const;

/** A pending grocery list share with one item; override any field. */
export function notification(
  overrides: Partial<GroceryListShareNotification> = {},
): GroceryListShareNotification {
  return {
    ...BASE,
    type: 'grocery-list-share',
    payload: {
      senderName: 'Peter',
      listName: 'Weekly',
      items: [{ name: 'Eggs', quantity: { amount: 2, unit: 'carton' }, category: 'protein' }],
    },
    ...overrides,
  };
}

/** "Peter shared a recipe with you"; override any field. */
export function recipeShareNotification(
  overrides: Partial<RecipeShareNotification> = {},
): RecipeShareNotification {
  return {
    ...BASE,
    id: 'n3',
    type: 'recipe-share',
    payload: { senderName: 'Peter', recipeId: 'r1', recipeTitle: 'Garlic Pasta' },
    ...overrides,
  };
}

/** "Peter stopped sharing a recipe with you"; override any field. */
export function recipeRevokedNotification(
  overrides: Partial<RecipeShareRevokedNotification> = {},
): RecipeShareRevokedNotification {
  return {
    ...BASE,
    id: 'n4',
    type: 'recipe-share-revoked',
    payload: { senderName: 'Peter', recipeId: 'r1', recipeTitle: 'Garlic Pasta' },
    ...overrides,
  };
}

/** "Peter added you to the live list Household"; override any field. */
export function listInviteNotification(
  overrides: Partial<GroceryListInviteNotification> = {},
): GroceryListInviteNotification {
  return {
    ...BASE,
    id: 'n5',
    type: 'grocery-list-invite',
    payload: { senderName: 'Peter', listId: 'list-7', listName: 'Household' },
    ...overrides,
  };
}
