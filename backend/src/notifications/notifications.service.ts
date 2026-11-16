import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationPayload,
  Notification,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';

/** Use-case layer for notifications. Knows nothing about what a notification is *for*. */
@Injectable()
export class NotificationsService {
  constructor(private readonly notifications: NotificationRepository) {}

  /** The user's notifications, newest first. */
  public async findAll(userId: string): Promise<Notification[]> {
    const all = await this.notifications.findByRecipient(userId);
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Sends a notification to `recipientId`. */
  public create(
    recipientId: string,
    senderId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<Notification> {
    return this.notifications.save(new Notification(recipientId, senderId, type, payload));
  }

  /** @throws NotFoundException if it does not exist or is addressed to someone else. */
  public async findOne(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notifications.findById(notificationId);
    if (!notification || !notification.isOwnedBy(userId)) {
      throw new NotFoundException(`Notification ${notificationId} not found.`);
    }
    return notification;
  }

  /**
   * Like `findOne`, but also requires a notification of this type that has not been answered yet.
   *
   * @throws ConflictException if it was already accepted or rejected.
   */
  public async findPending(
    userId: string,
    notificationId: string,
    type: NotificationType,
  ): Promise<Notification> {
    const notification = await this.findOne(userId, notificationId);
    if (notification.type !== type) {
      throw new NotFoundException(`Notification ${notificationId} not found.`);
    }
    if (notification.status !== NotificationStatus.Pending) {
      throw new ConflictException('You have already answered this notification.');
    }
    return notification;
  }

  /** Marks one notification as read. */
  public async markRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.findOne(userId, notificationId);
    notification.markRead();
    return this.notifications.save(notification);
  }

  /** Records accept/reject on a notification. */
  public async resolve(
    userId: string,
    notificationId: string,
    answer: NotificationStatus.Accepted | NotificationStatus.Rejected,
  ): Promise<Notification> {
    const notification = await this.findOne(userId, notificationId);
    notification.resolve(answer);
    return this.notifications.save(notification);
  }

  /** Deletes a user's `RecipeShare` notifications about one recipe (e.g. after it is revoked). */
  public async removeRecipeShares(recipientId: string, recipeId: string): Promise<void> {
    const all = await this.notifications.findByRecipient(recipientId);
    await Promise.all(
      all
        .filter(
          (notification) =>
            notification.type === NotificationType.RecipeShare &&
            'recipeId' in notification.payload &&
            notification.payload.recipeId === recipeId,
        )
        .map((notification) => this.notifications.delete(notification.id)),
    );
  }
}
