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

export function restrictionLabel(restriction: DietaryRestriction): string {
  return DIETARY_RESTRICTIONS.find((option) => option.value === restriction)?.label ?? restriction;
}

/** Share of daily calories from each macronutrient, in whole percent totalling 100. */
export interface MacroSplit {
  protein: number;
  carbohydrates: number;
  fat: number;
}

/** Daily goals derived by the backend; a field is null when its goal is not set. */
export interface DailyTargets {
  calories: number | null;
  /** Grams per day. */
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
}

/** As returned by `GET /users/me/preferences`. */
export interface UserPreferences {
  defaultServings: number;
  dietaryRestrictions: DietaryRestriction[];
  dailyCalories: number | null;
  macroSplit: MacroSplit | null;
  dailyTargets: DailyTargets;
}

/** Body of `PATCH /users/me/preferences`; omitted fields stay unchanged, `null` clears a goal. */
export interface PreferenceChanges {
  defaultServings?: number;
  dietaryRestrictions?: DietaryRestriction[];
  dailyCalories?: number | null;
  macroSplit?: MacroSplit | null;
}

/** Limits enforced by the backend's `UserPreferences`, mirrored for form hints. */
export const MAX_DEFAULT_SERVINGS = 50;
export const MIN_DAILY_CALORIES = 500;
export const MAX_DAILY_CALORIES = 10000;

/** Shown wherever dietary matching is used (spec 3.6: estimates, not allergy advice). */
export const DIETARY_DISCLAIMER =
  'Dietary matching is an estimate based on ingredient names. It is not medical or allergy ' +
  'advice, so always check the ingredients yourself.';
