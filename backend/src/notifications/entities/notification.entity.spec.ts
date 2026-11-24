import { asJson, storeAndRestore } from '../../common/testing/store-and-restore';
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

  describe('storage record', () => {
    it('restores the answer and read state', () => {
      notification.resolve(NotificationStatus.Rejected);

      const restored = storeAndRestore(notification, Notification.fromRecord);

      expect(asJson(restored)).toEqual(asJson(notification));
      expect(restored.toRecord()).toEqual(notification.toRecord());
      expect(() => restored.resolve(NotificationStatus.Accepted)).toThrow(DomainValidationError);
    });

    it('rejects an unknown stored status', () => {
      const record = { ...notification.toRecord(), status: 'maybe' as NotificationStatus };

      expect(() => Notification.fromRecord(record)).toThrow(DomainValidationError);
    });
  });
});
