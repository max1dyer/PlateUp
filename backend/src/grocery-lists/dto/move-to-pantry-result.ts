import { GroceryList } from '../entities/grocery-list.entity';

/** A grocery item that could not be moved to the pantry, and why. */
export interface SkippedPantryMove {
  name: string;
  reason: string;
}

/** Response of `POST /grocery-lists/:listId/purchased-items/pantry`. */
export interface MoveToPantryResult {
  list: GroceryList;
  /** Names of the items now in the pantry and off the list. */
  moved: string[];
  /** Items left on the list because the pantry could not take them. */
  skipped: SkippedPantryMove[];
}
