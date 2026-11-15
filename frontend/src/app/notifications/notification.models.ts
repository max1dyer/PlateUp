import { IngredientCategory, Quantity } from '../grocery-list/grocery-list.models';

/** Mirrors the backend `NotificationType` enum values. Add a value for each new kind. */
export type NotificationType = 'grocery-list-share';

/** Mirrors the backend `NotificationStatus` enum values. */
export type NotificationStatus = 'pending' | 'accepted' | 'rejected';

/** One item in a shared list. */
export interface SharedGroceryItem {
  name: string;
  quantity: Quantity | null;
  category: IngredientCategory;
}

/** Payload of a grocery list share: a snapshot of the list when it was sent. */
export interface GroceryListSharePayload {
  senderName: string;
  listName: string;
  items: SharedGroceryItem[];
}

/** A notification as returned by `GET /notifications`. `ownerId` is the recipient. */
export interface UserNotification {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  senderId: string;
  type: NotificationType;
  payload: GroceryListSharePayload;
  status: NotificationStatus;
  read: boolean;
}
