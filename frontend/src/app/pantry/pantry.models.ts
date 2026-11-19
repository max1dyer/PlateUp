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

/** How the pantry compares with an ingredient amount (mirrors the backend's `StockStatus`). */
export type StockStatus = 'enough' | 'partial' | 'missing' | 'unknown';

/** One line of `POST /pantry/stock-check`'s response. */
export interface StockLevel {
  name: string;
  needed: Quantity;
  /** The pantry's amount in the needed unit, or null if it has none that compares. */
  onHand: Quantity | null;
  /** The pantry's amount in its own unit, or null if it has none. */
  held: Quantity | null;
  status: StockStatus;
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
