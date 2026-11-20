/** Mirrors the backend's `DietaryRestriction` enum. */
export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'egg-free'
  | 'nut-free'
  | 'shellfish-free';

/** Every restriction in display order, with the label the UI shows. */
export const DIETARY_RESTRICTIONS: readonly { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'egg-free', label: 'Egg-free' },
  { value: 'nut-free', label: 'Nut-free' },
  { value: 'shellfish-free', label: 'Shellfish-free' },
];

/** The display label for a restriction ("gluten-free" -> "Gluten-free"). */
export function restrictionLabel(restriction: DietaryRestriction): string {
  return DIETARY_RESTRICTIONS.find((option) => option.value === restriction)?.label ?? restriction;
}

/** Energy per gram of each macronutrient (mirrors the backend). */
export const KCAL_PER_GRAM = { protein: 4, carbohydrates: 4, fat: 9 } as const;

/** The tracked macronutrients: protein, carbohydrates, and fat. */
export type Macro = keyof typeof KCAL_PER_GRAM;

/** Macros in display order, with their labels. */
export const MACROS: readonly { value: Macro; label: string }[] = [
  { value: 'protein', label: 'Protein' },
  { value: 'carbohydrates', label: 'Carbs' },
  { value: 'fat', label: 'Fat' },
];

/** Grams per day of each macronutrient; null means no goal for it. */
export type MacroGoals = Record<Macro, number | null>;

/**
 * The goals in effect each day, from the backend: the user's own goals plus
 * the one they determine (see `planMacros`); null when not set or derivable.
 */
export interface DailyTargets {
  calories: number | null;
  /** Grams per day. */
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
}

/** As returned by `GET /users/me/preferences`. */
export interface UserPreferences {
  /** Servings recipes open at, or null to use each recipe's own servings. */
  defaultServings: number | null;
  dietaryRestrictions: DietaryRestriction[];
  dailyCalories: number | null;
  macroGoals: MacroGoals;
  dailyTargets: DailyTargets;
  blockRecipeShares: boolean;
  blockListInvites: boolean;
  blockListCopies: boolean;
  /** When true, `maxCostPerServing` filters recipe searches and checks grocery additions. */
  budgetEnabled: boolean;
  /** Most the user wants to spend per serving, in US dollars, or null for no limit. */
  maxCostPerServing: number | null;
}

/** Body of `PATCH /users/me/preferences`; omitted fields stay unchanged, `null` clears a goal. */
export interface PreferenceChanges {
  defaultServings?: number | null;
  dietaryRestrictions?: DietaryRestriction[];
  dailyCalories?: number | null;
  macroGoals?: Partial<MacroGoals>;
  blockRecipeShares?: boolean;
  blockListInvites?: boolean;
  blockListCopies?: boolean;
  budgetEnabled?: boolean;
  maxCostPerServing?: number | null;
}

/** Limits enforced by the backend's `UserPreferences`, mirrored for form hints. */
export const MAX_DEFAULT_SERVINGS = 50;
export const MIN_DAILY_CALORIES = 500;
export const MAX_DAILY_CALORIES = 10000;
export const MAX_MACRO_GRAMS = 1000;
export const MAX_BUDGET_PER_SERVING = 1000;

/**
 * The per-serving limit in effect: the saved limit while the budget is on, otherwise null.
 * Mirrors the backend's `UserPreferences.activeBudget`.
 */
export function activeBudget(preferences: UserPreferences | null): number | null {
  return preferences?.budgetEnabled ? (preferences.maxCostPerServing ?? null) : null;
}

/** Dollars as shown in the app, e.g. "$3.50". */
export function formatMoney(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

/** Shown wherever dietary matching is used (spec 3.6: estimates, not allergy advice). */
export const DIETARY_DISCLAIMER =
  'Dietary matching is an estimate based on ingredient names. It is not medical or allergy ' +
  'advice, so always check the ingredients yourself.';
