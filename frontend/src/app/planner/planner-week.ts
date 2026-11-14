import { addDays, daysBetween, startOfWeek, toLocalDate } from '../core/calendar-date';
import { Nutrition } from '../recipes/recipe.models';
import { PlannedMeal } from './planner.models';

/** How far the planner reaches either side of today: about half a year. */
export const PLANNING_RANGE_DAYS = 183;

/** The first and last days the planner lets the user open (`YYYY-MM-DD`, inclusive). */
export interface PlanningRange {
  min: string;
  max: string;
}

/** The days the planner can show: half a year before `today` through half a year after. */
export function planningRange(today: string): PlanningRange {
  return { min: addDays(today, -PLANNING_RANGE_DAYS), max: addDays(today, PLANNING_RANGE_DAYS) };
}

/** True if `date` is a day the planner can show. */
export function isInRange(date: string, range: PlanningRange): boolean {
  return date >= range.min && date <= range.max;
}

/** `date` moved into the range: days before it become its first day, days after its last. */
export function clampToRange(date: string, range: PlanningRange): string {
  if (date < range.min) {
    return range.min;
  }
  return date > range.max ? range.max : date;
}

/** The seven days (Monday to Sunday) of the week containing `date`. */
export function weekDays(date: string): string[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/**
 * A heading for the week from `monday` to the Sunday after, e.g.
 * "September 21–27, 2026", "Sep 28 – Oct 4, 2026", or "Dec 28, 2026 – Jan 3, 2027".
 */
export function weekLabel(monday: string): string {
  const start = toLocalDate(monday);
  const end = toLocalDate(addDays(monday, 6));
  const month = (date: Date, style: 'long' | 'short'): string =>
    date.toLocaleDateString('en-US', { month: style });
  if (start.getFullYear() !== end.getFullYear()) {
    return (
      `${month(start, 'short')} ${start.getDate()}, ${start.getFullYear()} – ` +
      `${month(end, 'short')} ${end.getDate()}, ${end.getFullYear()}`
    );
  }
  if (start.getMonth() !== end.getMonth()) {
    return (
      `${month(start, 'short')} ${start.getDate()} – ` +
      `${month(end, 'short')} ${end.getDate()}, ${end.getFullYear()}`
    );
  }
  return `${month(start, 'long')} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
}

/** "Today", "Tomorrow", "Yesterday", or the weekday and date, e.g. "Monday, September 21". */
export function dayHeading(date: string, today: string): string {
  const offset = daysBetween(today, date);
  const full = toLocalDate(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const relative = { [-1]: 'Yesterday', 0: 'Today', 1: 'Tomorrow' }[offset];
  return relative ? `${relative}, ${full.split(', ')[1]}` : full;
}

/** Calories and macros for the servings planned in `meal` (the recipe's are per serving). */
export function mealNutrition(meal: PlannedMeal): Nutrition {
  const { calories, protein, carbohydrates, fat } = meal.recipe.nutrition;
  return {
    calories: Math.round(calories * meal.servings),
    protein: Math.round(protein * meal.servings),
    carbohydrates: Math.round(carbohydrates * meal.servings),
    fat: Math.round(fat * meal.servings),
  };
}

/** The combined nutrition of `meals`, counting every planned serving. */
export function totalNutrition(meals: readonly PlannedMeal[]): Nutrition {
  return meals.map(mealNutrition).reduce(
    (total, each) => ({
      calories: total.calories + each.calories,
      protein: total.protein + each.protein,
      carbohydrates: total.carbohydrates + each.carbohydrates,
      fat: total.fat + each.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );
}
