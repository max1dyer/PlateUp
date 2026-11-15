import { DomainValidationError } from '../../common/errors/domain-validation.error';
import {
  GroceryListSharePayload,
  Notification,
  NotificationStatus,
  NotificationType,
} from './notification.entity';

describe('Notification', () => {
  const payload: GroceryListSharePayload = { senderName: 'Peter', listName: 'Weekly', items: [] };
  let notification: Notification;

  beforeEach(() => {
    notification = new Notification('bob', 'peter', NotificationType.GroceryListShare, payload);
  });

  it('starts pending, unread, and addressed to the recipient', () => {
    expect(notification.status).toBe(NotificationStatus.Pending);
    expect(notification.isOwnedBy('bob')).toBe(true);
    expect(notification.toJSON().read).toBe(false);
  });

  it('can be accepted once, which also marks it read', () => {
    notification.resolve(NotificationStatus.Accepted);

    expect(notification.status).toBe(NotificationStatus.Accepted);
    expect(notification.toJSON().read).toBe(true);
    expect(() => notification.resolve(NotificationStatus.Rejected)).toThrow(DomainValidationError);
  });
});
