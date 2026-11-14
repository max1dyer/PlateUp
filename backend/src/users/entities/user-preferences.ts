import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { requireIntegerInRange, requireOneOf } from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';

/** Servings new accounts start with (spec 3.4: "a default serving size of ~2"). */
export const DEFAULT_SERVINGS = 2;
/** Limits for the default servings (at most) and the daily calorie goal (range). */
export const MAX_SERVINGS = 50;
export const MIN_DAILY_CALORIES = 500;
export const MAX_DAILY_CALORIES = 10000;
/** Most grams per day accepted for any one macro. */
export const MAX_MACRO_GRAMS = 1000;

/** Energy per gram of each macronutrient. */
export const KCAL_PER_GRAM = { protein: 4, carbohydrates: 4, fat: 9 } as const;

/** The tracked macronutrients: protein, carbohydrates, and fat. */
export type Macro = keyof typeof KCAL_PER_GRAM;
/** Every macro name, for looping over the goals. */
const MACROS = Object.keys(KCAL_PER_GRAM) as Macro[];

/** Grams per day of each macronutrient; null means no goal for it. */
export type MacroGoals = Record<Macro, number | null>;

/** The user-editable preference fields. */
export interface UserPreferencesProps {
  /** Servings a recipe opens at, whatever servings it was written for. */
  defaultServings: number;
  /** Recipes breaking any of these are hidden from the feed or flagged. */
  dietaryRestrictions: DietaryRestriction[];
  /** Daily calorie goal, or null for none. */
  dailyCalories: number | null;
  /** Daily gram goal for each macro; each may be null independently. */
  macroGoals: MacroGoals;
}

/** A partial edit; `macroGoals` may name only the macros that change. */
export type UserPreferencesChanges = Partial<Omit<UserPreferencesProps, 'macroGoals'>> & {
  macroGoals?: Partial<MacroGoals>;
};

/**
 * The goals in effect each day. Each field is the user's own goal when set;
 * otherwise it is filled in from the others when they determine it (see
 * `deriveDailyTargets`), and null when they do not.
 */
export interface DailyTargets {
  calories: number | null;
  /** Grams per day. */
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
}

/** What preferences serialize to: the saved goals plus the targets derived from them. */
export interface UserPreferencesJson extends UserPreferencesProps {
  dailyTargets: DailyTargets;
}

/**
 * Fills in the one goal the others determine:
 * - no calorie goal but all three macros set: calories are their total energy;
 * - a calorie goal and exactly one macro unset: that macro gets the calories
 *   left over (rounded down to whole grams), or 0 if the others already use
 *   them up.
 * Anything else is returned as given. A calorie goal smaller than the macros'
 * energy is kept as is; the preferences page warns about the overshoot.
 */
export function deriveDailyTargets(calories: number | null, macros: MacroGoals): DailyTargets {
  const unset = MACROS.filter((macro) => macros[macro] === null);
  // Energy already accounted for by the macros that have a goal.
  const macroCalories = MACROS.reduce(
    (total, macro) => total + (macros[macro] ?? 0) * KCAL_PER_GRAM[macro],
    0,
  );
  const targets: DailyTargets = { calories, ...macros };
  if (calories === null && unset.length === 0) {
    // Only calories are missing: they follow from the three macro goals.
    targets.calories = macroCalories;
  } else if (calories !== null && unset.length === 1) {
    // One macro is missing: give it whatever calories the other two leave.
    const [missing] = unset;
    targets[missing] = Math.max(0, Math.floor((calories - macroCalories) / KCAL_PER_GRAM[missing]));
  }
  return targets;
}

/**
 * A user's personal settings (UC10): default servings, dietary restrictions,
 * and a daily calorie goal with gram goals per macro. Immutable value object;
 * `with()` returns a validated copy.
 */
export class UserPreferences {
  public readonly defaultServings: number;
  public readonly dietaryRestrictions: readonly DietaryRestriction[];
  public readonly dailyCalories: number | null;
  public readonly macroGoals: Readonly<MacroGoals>;

  /** @throws DomainValidationError if any value is out of range or not recognised. */
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
    this.macroGoals = UserPreferences.validateMacroGoals(props.macroGoals);
  }

  /** What a new account starts with: default servings, no restrictions, no goals. */
  public static defaults(): UserPreferences {
    return new UserPreferences({
      defaultServings: DEFAULT_SERVINGS,
      dietaryRestrictions: [],
      dailyCalories: null,
      macroGoals: { protein: null, carbohydrates: null, fat: null },
    });
  }

  /** A copy with `changes` applied; the result is validated as a whole. */
  public with(changes: UserPreferencesChanges): UserPreferences {
    const current = this.toProps();
    return new UserPreferences({
      ...current,
      ...changes,
      // Merge macro goals separately so changing one macro keeps the other two.
      macroGoals: { ...current.macroGoals, ...changes.macroGoals },
    });
  }

  /** The goals in effect, including the one the others determine. */
  public get dailyTargets(): DailyTargets {
    return deriveDailyTargets(this.dailyCalories, this.macroGoals);
  }

  /** Serializes the saved preferences together with the derived `dailyTargets`. */
  public toJSON(): UserPreferencesJson {
    return { ...this.toProps(), dailyTargets: this.dailyTargets };
  }

  /** A plain, mutable copy of the current values (used to build an edited copy). */
  private toProps(): UserPreferencesProps {
    return {
      defaultServings: this.defaultServings,
      dietaryRestrictions: [...this.dietaryRestrictions],
      dailyCalories: this.dailyCalories,
      macroGoals: { ...this.macroGoals },
    };
  }

  /** Checks each value and drops repeats, keeping the display order. */
  private static validateRestrictions(restrictions: DietaryRestriction[]): DietaryRestriction[] {
    if (!Array.isArray(restrictions)) {
      throw new DomainValidationError('Dietary restrictions must be a list.');
    }
    restrictions.forEach((value) => requireOneOf(value, DietaryRestriction, 'dietary restriction'));
    // Filtering the enum (rather than the input) removes duplicates and sorts into display order.
    return Object.values(DietaryRestriction).filter((value) => restrictions.includes(value));
  }

  /**
   * Checks each macro goal is null or a whole number of grams from 0 to `MAX_MACRO_GRAMS`. A macro
   * left out of `goals` is treated as null.
   */
  private static validateMacroGoals(goals: MacroGoals): MacroGoals {
    if (typeof goals !== 'object' || goals === null) {
      throw new DomainValidationError('Macro goals must be an object.');
    }
    const label: Record<Macro, string> = {
      protein: 'Protein',
      carbohydrates: 'Carbohydrates',
      fat: 'Fat',
    };
    const grams = (macro: Macro): number | null => {
      const value = goals[macro] ?? null;
      return value === null
        ? null
        : requireIntegerInRange(value, 0, MAX_MACRO_GRAMS, `${label[macro]} (g)`);
    };
    return { protein: grams('protein'), carbohydrates: grams('carbohydrates'), fat: grams('fat') };
  }
}
