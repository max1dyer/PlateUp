import { Quantity } from '../grocery-list/grocery-list.models';

/** An ingredient on hand, as returned by `GET /pantry`. */
export interface PantryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  name: string;
  quantity: Quantity;
}

/** Body of `POST /pantry`; an ingredient already held is combined with it. */
export interface NewPantryItem {
  name: string;
  quantity: Quantity;
}

/** Body of `PATCH /pantry/:itemId`; omitted fields stay unchanged. */
export interface PantryItemChanges {
  name?: string;
  quantity?: Quantity;
}
