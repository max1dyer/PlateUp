import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { MacroGoals } from '../entities/user-preferences';

/**
 * Body of `PATCH /users/me/preferences`. Omitted fields stay unchanged and
 * `null` clears a goal; `macroGoals` may name only the macros that change.
 */
export class UpdatePreferencesDto {
  /** `null` opens each recipe at its own servings. */
  public readonly defaultServings?: number | null;
  public readonly dietaryRestrictions?: DietaryRestriction[];
  public readonly dailyCalories?: number | null;
  public readonly macroGoals?: Partial<MacroGoals>;
  public readonly blockRecipeShares?: boolean;
  public readonly blockListInvites?: boolean;
  public readonly blockListCopies?: boolean;
  public readonly budgetEnabled?: boolean;
  /** Dollars per serving; `null` removes the limit. */
  public readonly maxCostPerServing?: number | null;
}
