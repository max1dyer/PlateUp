import { IngredientCategory } from '../../common/domain/ingredient-category';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Unit } from '../../common/domain/quantity';
import { DomainValidationError } from '../../common/errors/domain-validation.error';

/** What a notification is about. Add a value here for each new kind (e.g. a rating). */
export enum NotificationType {
  GroceryListInvite = 'grocery-list-invite',
  GroceryListShare = 'grocery-list-share',
  RecipeShare = 'recipe-share',
  RecipeShareRevoked = 'recipe-share-revoked',
}

/** Whether the recipient has answered a notification that asks for a response. */
export enum NotificationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

/** One item in a shared list: plain data, so it can be stored and sent as JSON. */
export interface SharedGroceryItem {
  name: string;
  quantity: { amount: number; unit: Unit } | null;
  category: IngredientCategory;
}

/** Payload of a `GroceryListShare`: a snapshot of the list at the moment it was sent. */
export interface GroceryListSharePayload {
  senderName: string;
  listName: string;
  items: SharedGroceryItem[];
}

/** Payload of a `GroceryListInvite`: who added the recipient to which live (shared) list. */
export interface GroceryListInvitePayload {
  senderName: string;
  listId: string;
  listName: string;
}

/** Payload of `RecipeShare` and `RecipeShareRevoked`: who, and which recipe. */
export interface RecipeSharePayload {
  senderName: string;
  recipeId: string;
  recipeTitle: string;
}

/** What a notification carries; narrow it by `type` (or with `in`) before using it. */
export type NotificationPayload =
  GroceryListInvitePayload | GroceryListSharePayload | RecipeSharePayload;

/** The fields a notification serializes to. `ownerId` is the recipient. */
export interface NotificationSnapshot {
  ownerId: string;
  senderId: string;
  type: NotificationType;
  payload: NotificationPayload;
  status: NotificationStatus;
  read: boolean;
}

/** A message for one user, such as "Peter sent you a grocery list", with Accept/Reject. */
export class Notification extends OwnedEntity<NotificationSnapshot> {
  private currentStatus = NotificationStatus.Pending;
  private isRead = false;

  constructor(
    recipientId: string,
    public readonly senderId: string,
    public readonly type: NotificationType,
    public readonly payload: NotificationPayload,
  ) {
    super(recipientId);
  }

  public get status(): NotificationStatus {
    return this.currentStatus;
  }

  /** Marks the notification as seen. */
  public markRead(): void {
    if (!this.isRead) {
      this.isRead = true;
      this.touch();
    }
  }

  /**
   * Records the recipient's answer (also marks it read).
   *
   * @throws DomainValidationError if it was already answered.
   */
  public resolve(answer: NotificationStatus.Accepted | NotificationStatus.Rejected): void {
    if (this.currentStatus !== NotificationStatus.Pending) {
      throw new DomainValidationError('This notification has already been answered.');
    }
    this.currentStatus = answer;
    this.isRead = true;
    this.touch();
  }

  protected snapshot(): NotificationSnapshot {
    return {
      ownerId: this.ownerId,
      senderId: this.senderId,
      type: this.type,
      payload: this.payload,
      status: this.currentStatus,
      read: this.isRead,
    };
  }
}
