import { IngredientCategory, Quantity } from '../grocery-list/grocery-list.models';

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

/** Payload of a recipe share and of its revoked notice. */
export interface RecipeSharePayload {
  senderName: string;
  recipeId: string;
  recipeTitle: string;
}

/** Fields every notification has. `ownerId` is the recipient. */
interface NotificationBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  senderId: string;
  status: NotificationStatus;
  read: boolean;
}

/** A shared grocery list the recipient can accept or reject. */
export interface GroceryListShareNotification extends NotificationBase {
  type: 'grocery-list-share';
  payload: GroceryListSharePayload;
}

/** A recipe shared with the recipient (visible at once; `status` stays pending). */
export interface RecipeShareNotification extends NotificationBase {
  type: 'recipe-share';
  payload: RecipeSharePayload;
}

/** Tells the recipient the author stopped sharing a recipe with them. */
export interface RecipeShareRevokedNotification extends NotificationBase {
  type: 'recipe-share-revoked';
  payload: RecipeSharePayload;
}

/** A notification as returned by `GET /notifications`; narrow it by `type`. */
export type UserNotification =
  GroceryListShareNotification | RecipeShareNotification | RecipeShareRevokedNotification;

/** Mirrors the backend `NotificationType` enum values. */
export type NotificationType = UserNotification['type'];
