import { KCAL_PER_GRAM, MACROS, Macro, MacroGoals } from './preferences.models';

/** Leftover calories below one gram of fat count as an exact match. */
const BALANCE_TOLERANCE = KCAL_PER_GRAM.fat;

/**
 * How the calorie goal and macro goals fit together:
 * - `empty`: nothing entered;
 * - `partial`: not enough entered to compare them;
 * - `balanced`: the macros make up the calorie goal;
 * - `under`: all three macros are set and leave calories unassigned;
 * - `over`: the macros add up to more than the calorie goal.
 */
export type MacroPlanStatus = 'empty' | 'partial' | 'balanced' | 'under' | 'over';

/** Everything the goals form needs to show for the current calorie and macro entries. */
export interface MacroPlan {
  status: MacroPlanStatus;
  /** The value an empty field would get, shown as a preview; null when none. */
  preview: { field: 'calories' | Macro; value: number } | null;
  /** Calories per day: the goal, or the previewed total. */
  calories: number | null;
  /** Grams per macro: entered, or previewed. */
  grams: MacroGoals;
  /** Calories from each macro's grams (entered or previewed). */
  caloriesByMacro: Record<Macro, number>;
  /** Total calories from the grams the user entered. */
  enteredCalories: number;
  /** How far the entered macros go past the calorie goal; 0 when they do not. */
  overshoot: number;
  /** Calories of the goal no macro accounts for when all three are set; else 0. */
  unassigned: number;
}

/**
 * Works out the preview and the over/under state for the goals form. The
 * previews follow the same rule as the backend's `deriveDailyTargets`, so
 * what the form previews is what the recipe page will use:
 * - no calorie goal but all three macros set: calories are their total;
 * - a calorie goal and exactly one macro unset: that macro gets the calories
 *   left over, rounded down to whole grams (0 if there are none left).
 */
export function planMacros(calories: number | null, macros: MacroGoals): MacroPlan {
  // Macros the user left blank.
  const unset = MACROS.map((macro) => macro.value).filter((macro) => macros[macro] === null);
  // Total calories from a set of gram goals (blank macros count as 0 g).
  const energy = (grams: MacroGoals): number =>
    MACROS.reduce((total, { value }) => total + (grams[value] ?? 0) * KCAL_PER_GRAM[value], 0);
  const enteredCalories = energy(macros);
  const grams: MacroGoals = { ...macros };
  let preview: MacroPlan['preview'] = null;
  let total = calories;

  // Same two derivation rules as the backend (see the doc comment above).
  if (calories === null && unset.length === 0) {
    total = enteredCalories;
    preview = { field: 'calories', value: enteredCalories };
  } else if (calories !== null && unset.length === 1) {
    const [missing] = unset;
    const left = Math.max(0, Math.floor((calories - enteredCalories) / KCAL_PER_GRAM[missing]));
    grams[missing] = left;
    preview = { field: missing, value: left };
  }

  const caloriesByMacro = {
    protein: (grams.protein ?? 0) * KCAL_PER_GRAM.protein,
    carbohydrates: (grams.carbohydrates ?? 0) * KCAL_PER_GRAM.carbohydrates,
    fat: (grams.fat ?? 0) * KCAL_PER_GRAM.fat,
  };
  // How far the entered macros exceed the calorie goal, and how much of the goal is left unassigned
  // once all three macros are set (ignoring leftovers under one gram of fat).
  const overshoot = calories === null ? 0 : Math.max(0, enteredCalories - calories);
  const leftover = calories === null ? 0 : calories - energy(grams);
  const unassigned =
    calories !== null && unset.length === 0 && leftover >= BALANCE_TOLERANCE ? leftover : 0;

  return {
    status: statusOf(calories, unset.length, overshoot, unassigned, preview),
    preview,
    calories: total,
    grams,
    caloriesByMacro,
    enteredCalories,
    overshoot,
    unassigned,
  };
}

/** Picks the overall status; an overshoot takes priority over everything but an empty form. */
function statusOf(
  calories: number | null,
  unsetCount: number,
  overshoot: number,
  unassigned: number,
  preview: MacroPlan['preview'],
): MacroPlanStatus {
  if (calories === null && unsetCount === MACROS.length) {
    return 'empty';
  }
  if (overshoot > 0) {
    return 'over';
  }
  if (unassigned > 0) {
    return 'under';
  }
  if (preview !== null || (calories !== null && unsetCount === 0)) {
    return 'balanced';
  }
  return 'partial';
}
