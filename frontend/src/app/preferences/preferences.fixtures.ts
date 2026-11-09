import { UserPreferences } from './preferences.models';

/** Test data shaped like the backend's JSON (a new account's defaults). */
export function preferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    defaultServings: 2,
    dietaryRestrictions: [],
    dailyCalories: null,
    macroSplit: null,
    dailyTargets: { calories: null, protein: null, carbohydrates: null, fat: null },
    ...overrides,
  };
}
