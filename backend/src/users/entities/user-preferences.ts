import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { requireIntegerInRange, requireOneOf } from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';

/** Servings new accounts start with (spec 3.4: "a default serving size of ~2"). */
export const DEFAULT_SERVINGS = 2;
export const MAX_SERVINGS = 50;
export const MIN_DAILY_CALORIES = 500;
export const MAX_DAILY_CALORIES = 10000;

/** Energy per gram of each macronutrient, used to turn a calorie split into grams. */
const KCAL_PER_GRAM = { protein: 4, carbohydrates: 4, fat: 9 } as const;

/** Share of daily calories from each macronutrient, in whole percent totalling 100. */
export interface MacroSplit {
  protein: number;
  carbohydrates: number;
  fat: number;
}

/** The user-editable preference fields. */
export interface UserPreferencesProps {
  /** Servings a recipe opens at, whatever servings it was written for. */
  defaultServings: number;
  /** Recipes breaking any of these are hidden from the feed or flagged. */
  dietaryRestrictions: DietaryRestriction[];
  /** Daily calorie goal, or null for none. */
  dailyCalories: number | null;
  /** How the daily calories split into macros, or null for no macro goal. */
  macroSplit: MacroSplit | null;
}

/** Daily targets derived from the goals; a field is null when its goal is not set. */
export interface DailyTargets {
  calories: number | null;
  /** Grams per day. */
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
}

export interface UserPreferencesJson extends UserPreferencesProps {
  dailyTargets: DailyTargets;
}

/**
 * A user's personal settings (UC10): default servings, dietary restrictions,
 * and calorie and macro goals. Immutable value object; `with()` returns a
 * validated copy.
 */
export class UserPreferences {
  public readonly defaultServings: number;
  public readonly dietaryRestrictions: readonly DietaryRestriction[];
  public readonly dailyCalories: number | null;
  public readonly macroSplit: Readonly<MacroSplit> | null;

  constructor(props: UserPreferencesProps) {
    this.defaultServings = requireIntegerInRange(
      props.defaultServings,
      1,
      MAX_SERVINGS,
      'Default servings',
    );
    this.dietaryRestrictions = UserPreferences.validateRestrictions(props.dietaryRestrictions);
    this.dailyCalories =
      props.dailyCalories === null
        ? null
        : requireIntegerInRange(
            props.dailyCalories,
            MIN_DAILY_CALORIES,
            MAX_DAILY_CALORIES,
            'Daily calories',
          );
    this.macroSplit =
      props.macroSplit === null ? null : UserPreferences.validateSplit(props.macroSplit);
  }

  /** What a new account starts with: default servings, no restrictions, no goals. */
  public static defaults(): UserPreferences {
    return new UserPreferences({
      defaultServings: DEFAULT_SERVINGS,
      dietaryRestrictions: [],
      dailyCalories: null,
      macroSplit: null,
    });
  }

  /** A copy with `changes` applied; the result is validated as a whole. */
  public with(changes: Partial<UserPreferencesProps>): UserPreferences {
    return new UserPreferences({ ...this.toProps(), ...changes });
  }

  /** Daily calories, and grams of each macro when a split is set too. */
  public get dailyTargets(): DailyTargets {
    const calories = this.dailyCalories;
    const split = this.macroSplit;
    const grams = (macro: keyof MacroSplit): number | null =>
      calories === null || split === null
        ? null
        : Math.round((calories * split[macro]) / 100 / KCAL_PER_GRAM[macro]);
    return {
      calories,
      protein: grams('protein'),
      carbohydrates: grams('carbohydrates'),
      fat: grams('fat'),
    };
  }

  public toJSON(): UserPreferencesJson {
    return { ...this.toProps(), dailyTargets: this.dailyTargets };
  }

  private toProps(): UserPreferencesProps {
    return {
      defaultServings: this.defaultServings,
      dietaryRestrictions: [...this.dietaryRestrictions],
      dailyCalories: this.dailyCalories,
      macroSplit: this.macroSplit === null ? null : { ...this.macroSplit },
    };
  }

  /** Checks each value and drops repeats, keeping the display order. */
  private static validateRestrictions(restrictions: DietaryRestriction[]): DietaryRestriction[] {
    if (!Array.isArray(restrictions)) {
      throw new DomainValidationError('Dietary restrictions must be a list.');
    }
    restrictions.forEach((value) => requireOneOf(value, DietaryRestriction, 'dietary restriction'));
    return Object.values(DietaryRestriction).filter((value) => restrictions.includes(value));
  }

  /** Spec 3.1: macro splits that do not total 100% are rejected. */
  private static validateSplit(split: MacroSplit): MacroSplit {
    const checked = {
      protein: requireIntegerInRange(split.protein, 0, 100, 'Protein %'),
      carbohydrates: requireIntegerInRange(split.carbohydrates, 0, 100, 'Carbohydrates %'),
      fat: requireIntegerInRange(split.fat, 0, 100, 'Fat %'),
    };
    if (checked.protein + checked.carbohydrates + checked.fat !== 100) {
      throw new DomainValidationError('Protein, carbohydrates, and fat must add up to 100%.');
    }
    return checked;
  }
}
