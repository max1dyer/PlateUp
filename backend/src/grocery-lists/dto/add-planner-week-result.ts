import { GroceryList } from '../entities/grocery-list.entity';
import { SkippedNeed } from '../entities/shopping-needs';

/** Response of `POST /grocery-lists/:listId/planner-week`. */
export interface AddPlannerWeekResult {
  list: GroceryList;
  /** Names of the ingredients added to (or combined into) the list. */
  added: string[];
  /** Names of ingredients the pantry already holds enough of ("Already in your Pantry"). */
  coveredByPantry: string[];
  /** Ingredients that could not be added, with the reason. */
  skipped: SkippedNeed[];
}
