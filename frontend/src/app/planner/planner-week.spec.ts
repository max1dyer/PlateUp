import { plannedMeal } from './planner.fixtures';
import {
  clampToRange,
  dayHeading,
  isInRange,
  mealNutrition,
  planningRange,
  totalNutrition,
  weekDays,
  weekLabel,
} from './planner-week';

describe('planner week helpers', () => {
  it('planningRange reaches half a year either side of today', () => {
    const range = planningRange('2026-09-21');

    expect(range).toEqual({ min: '2026-03-22', max: '2027-03-23' });
    expect(isInRange('2026-03-22', range)).toBe(true);
    expect(isInRange('2026-03-21', range)).toBe(false);
    expect(clampToRange('2025-01-01', range)).toBe('2026-03-22');
    expect(clampToRange('2030-01-01', range)).toBe('2027-03-23');
    expect(clampToRange('2026-10-01', range)).toBe('2026-10-01');
  });

  it('weekDays lists Monday to Sunday of the week containing a date', () => {
    expect(weekDays('2026-09-24')).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
  });

  it('weekLabel shortens weeks that span months or years', () => {
    expect(weekLabel('2026-09-21')).toBe('September 21–27, 2026');
    expect(weekLabel('2026-09-28')).toBe('Sep 28 – Oct 4, 2026');
    expect(weekLabel('2026-12-28')).toBe('Dec 28, 2026 – Jan 3, 2027');
  });

  it('dayHeading names nearby days', () => {
    expect(dayHeading('2026-09-21', '2026-09-21')).toBe('Today, September 21');
    expect(dayHeading('2026-09-22', '2026-09-21')).toBe('Tomorrow, September 22');
    expect(dayHeading('2026-09-24', '2026-09-21')).toBe('Thursday, September 24');
  });

  it('mealNutrition and totalNutrition count every planned serving', () => {
    const lunch = plannedMeal({ servings: 2 });
    const snack = plannedMeal({
      servings: 1,
      recipe: {
        ...plannedMeal().recipe,
        nutrition: { calories: 80, protein: 0, fat: 0, carbohydrates: 20 },
      },
    });

    expect(mealNutrition(lunch)).toEqual({
      calories: 1100,
      protein: 90,
      fat: 20,
      carbohydrates: 120,
    });
    expect(totalNutrition([lunch, snack])).toEqual({
      calories: 1180,
      protein: 90,
      fat: 20,
      carbohydrates: 140,
    });
    expect(totalNutrition([])).toEqual({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
  });
});
