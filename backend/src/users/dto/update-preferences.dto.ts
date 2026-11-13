import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { MacroGoals } from '../entities/user-preferences';

/**
 * Body of `PATCH /users/me/preferences`. Omitted fields stay unchanged and
 * `null` clears a goal; `macroGoals` may name only the macros that change.
 */
export class UpdatePreferencesDto {
  public readonly defaultServings?: number;
  public readonly dietaryRestrictions?: DietaryRestriction[];
  public readonly dailyCalories?: number | null;
  public readonly macroGoals?: Partial<MacroGoals>;
}
