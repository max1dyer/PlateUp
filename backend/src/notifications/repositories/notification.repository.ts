import { Repository } from '../../common/persistence/repository';
import { Notification } from '../entities/notification.entity';

/** DI token and contract for notification storage. */
export abstract class NotificationRepository extends Repository<Notification> {
  /** Every notification addressed to this user. */
  public abstract findByRecipient(recipientId: string): Promise<Notification[]>;
}
