import { UserNotification } from './notification.models';

/** A pending grocery list share with one item; override any field. */
export function notification(overrides: Partial<UserNotification> = {}): UserNotification {
  return {
    id: 'n1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ownerId: 'bob',
    senderId: 'peter',
    type: 'grocery-list-share',
    status: 'pending',
    read: false,
    payload: {
      senderName: 'Peter',
      listName: 'Weekly',
      items: [{ name: 'Eggs', quantity: { amount: 2, unit: 'carton' }, category: 'protein' }],
    },
    ...overrides,
  };
}
