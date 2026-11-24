import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { requireBoolean, requireIntegerInRange, requireOneOf } from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';

/**
 * Servings new accounts start with (spec 3.4: "a default serving size of ~2"). Users can clear it
 * (null) to open each recipe at its own servings.
 */
export const DEFAULT_SERVINGS = 2;
/** Limits for the default servings (at most) and the daily calorie goal (range). */
export const MAX_SERVINGS = 50;
export const MIN_DAILY_CALORIES = 500;
export const MAX_DAILY_CALORIES = 10000;
/** Most grams per day accepted for any one macro. */
export const MAX_MACRO_GRAMS = 1000;
/** Most dollars per serving accepted for a budget. */
export const MAX_BUDGET_PER_SERVING = 1000;

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
  /** Servings a recipe opens at, or null to open each recipe at the servings it was written for. */
  defaultServings: number | null;
  /** Recipes breaking any of these are hidden from the feed or flagged. */
  dietaryRestrictions: DietaryRestriction[];
  /** Daily calorie goal, or null for none. */
  dailyCalories: number | null;
  /** Daily gram goal for each macro; each may be null independently. */
  macroGoals: MacroGoals;
  /** When true, other users cannot share recipes with this user. */
  blockRecipeShares: boolean;
  /** When true, other users cannot add this user to a live (shared) grocery list. */
  blockListInvites: boolean;
  /** When true, other users cannot send this user a copy of a grocery list. */
  blockListCopies: boolean;
  /** When true, the budget below is used when searching recipes and building grocery lists. */
  budgetEnabled: boolean;
  /** Most the user wants to spend per serving, in US dollars, or null for no limit. */
  maxCostPerServing: number | null;
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
 * a daily calorie goal with gram goals per macro, what other users may
 * share with them (recipes, live grocery lists, list copies), and a budget per serving that can be
 * turned on or off. Immutable value object;
 * `with()` returns a validated copy.
 */
export class UserPreferences {
  public readonly defaultServings: number | null;
  public readonly dietaryRestrictions: readonly DietaryRestriction[];
  public readonly dailyCalories: number | null;
  public readonly macroGoals: Readonly<MacroGoals>;
  public readonly blockRecipeShares: boolean;
  public readonly blockListInvites: boolean;
  public readonly blockListCopies: boolean;
  public readonly budgetEnabled: boolean;
  public readonly maxCostPerServing: number | null;

  /** @throws DomainValidationError if any value is out of range or not recognised. */
  constructor(props: UserPreferencesProps) {
    this.defaultServings =
      props.defaultServings === null
        ? null
        : requireIntegerInRange(props.defaultServings, 1, MAX_SERVINGS, 'Default servings');
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
    this.blockRecipeShares = requireBoolean(props.blockRecipeShares, 'Block recipe shares');
    this.blockListInvites = requireBoolean(props.blockListInvites, 'Block live list invites');
    this.blockListCopies = requireBoolean(props.blockListCopies, 'Block grocery list copies');
    this.budgetEnabled = requireBoolean(props.budgetEnabled, 'Use my budget');
    this.maxCostPerServing = UserPreferences.validateBudget(props.maxCostPerServing);
  }

  /** What a new account starts with: default servings, no restrictions, no goals. */
  public static defaults(): UserPreferences {
    return new UserPreferences({
      defaultServings: DEFAULT_SERVINGS,
      dietaryRestrictions: [],
      dailyCalories: null,
      macroGoals: { protein: null, carbohydrates: null, fat: null },
      blockRecipeShares: false,
      blockListInvites: false,
      blockListCopies: false,
      budgetEnabled: false,
      maxCostPerServing: null,
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

  /**
   * The per-serving limit to apply right now: the saved limit while the budget is turned on,
   * otherwise null (no limit).
   */
  public get activeBudget(): number | null {
    return this.budgetEnabled ? this.maxCostPerServing : null;
  }

  /** The goals in effect, including the one the others determine. */
  public get dailyTargets(): DailyTargets {
    return deriveDailyTargets(this.dailyCalories, this.macroGoals);
  }

  /** Serializes the saved preferences together with the derived `dailyTargets`. */
  public toJSON(): UserPreferencesJson {
    return { ...this.toProps(), dailyTargets: this.dailyTargets };
  }

  /**
   * A plain, mutable copy of the current values, used to build an edited copy and as the stored
   * form (`new UserPreferences(props)` restores it).
   */
  public toProps(): UserPreferencesProps {
    return {
      defaultServings: this.defaultServings,
      dietaryRestrictions: [...this.dietaryRestrictions],
      dailyCalories: this.dailyCalories,
      macroGoals: { ...this.macroGoals },
      blockRecipeShares: this.blockRecipeShares,
      blockListInvites: this.blockListInvites,
      blockListCopies: this.blockListCopies,
      budgetEnabled: this.budgetEnabled,
      maxCostPerServing: this.maxCostPerServing,
    };
  }

  /** Null (no limit) or more than $0 and at most `MAX_BUDGET_PER_SERVING`, rounded to the cent. */
  private static validateBudget(dollars: number | null | undefined): number | null {
    if (dollars === null || dollars === undefined) {
      return null;
    }
    if (
      typeof dollars !== 'number' ||
      !Number.isFinite(dollars) ||
      dollars <= 0 ||
      dollars > MAX_BUDGET_PER_SERVING
    ) {
      throw new DomainValidationError(
        `Budget per serving must be more than $0 and at most $${MAX_BUDGET_PER_SERVING}.`,
      );
    }
    return Math.round(dollars * 100) / 100;
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
