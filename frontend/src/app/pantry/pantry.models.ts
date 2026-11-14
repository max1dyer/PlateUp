import { Quantity } from '../grocery-list/grocery-list.models';

/** An ingredient on hand, as returned by `GET /pantry`. */
export interface PantryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  name: string;
  quantity: Quantity;
  /** Day the item expires (`YYYY-MM-DD`), or null if the user gave none. */
  expiresOn: string | null;
}

/** Body of `POST /pantry`; an ingredient already held is combined with it. */
export interface NewPantryItem {
  name: string;
  quantity: Quantity;
  /** Optional expiration date; a combined item keeps the earlier date. */
  expiresOn?: string | null;
}

/** Body of `PATCH /pantry/:itemId`; omitted fields stay unchanged. */
export interface PantryItemChanges {
  name?: string;
  quantity?: Quantity;
  /** `null` clears the expiration date. */
  expiresOn?: string | null;
}
