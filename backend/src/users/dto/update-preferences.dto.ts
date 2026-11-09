import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { MacroSplit } from '../entities/user-preferences';

/** Body of `PATCH /users/me/preferences`; omitted fields stay unchanged, `null` clears a goal. */
export class UpdatePreferencesDto {
  public readonly defaultServings?: number;
  public readonly dietaryRestrictions?: DietaryRestriction[];
  public readonly dailyCalories?: number | null;
  public readonly macroSplit?: MacroSplit | null;
}
