import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { MealSlot, PlannedMeal, compareMeals } from './planned-meal.entity';

describe('PlannedMeal', () => {
  const meal = (date = '2026-09-21', slot = MealSlot.Lunch): PlannedMeal =>
    new PlannedMeal('alice', 'recipe-1', date, slot, 2);

  it('starts not eaten and serializes its plan', () => {
    expect(meal().toJSON()).toMatchObject({
      ownerId: 'alice',
      recipeId: 'recipe-1',
      date: '2026-09-21',
      slot: 'lunch',
      servings: 2,
      eaten: false,
    });
  });

  it('rejects an invalid date, meal time, or servings', () => {
    expect(() => new PlannedMeal('alice', 'r', '2026-02-30', MealSlot.Lunch, 2)).toThrow(
      DomainValidationError,
    );
    expect(() => new PlannedMeal('alice', 'r', '2026-09-21', 'brunch' as MealSlot, 2)).toThrow(
      'Unknown meal "brunch".',
    );
    expect(() => new PlannedMeal('alice', 'r', '2026-09-21', MealSlot.Lunch, 0)).toThrow(
      'Servings must be a whole number from 1 to 50.',
    );
    expect(() => new PlannedMeal('alice', 'r', '2026-09-21', MealSlot.Lunch, 1.5)).toThrow(
      DomainValidationError,
    );
  });

  it('update moves the meal, changes servings, and marks it eaten', () => {
    const planned = meal();

    planned.update({ date: '2026-09-23', slot: MealSlot.Dinner, servings: 4, eaten: true });

    expect(planned.toJSON()).toMatchObject({
      date: '2026-09-23',
      slot: 'dinner',
      servings: 4,
      eaten: true,
    });
  });

  it('update applies nothing when any change is invalid', () => {
    const planned = meal();

    expect(() => planned.update({ date: '2026-09-25', servings: 0 })).toThrow(
      DomainValidationError,
    );
    expect(planned.date).toBe('2026-09-21');
    expect(planned.servings).toBe(2);
  });

  it('isBetween includes both ends of the range', () => {
    expect(meal('2026-09-21').isBetween('2026-09-21', '2026-09-27')).toBe(true);
    expect(meal('2026-09-27').isBetween('2026-09-21', '2026-09-27')).toBe(true);
    expect(meal('2026-09-28').isBetween('2026-09-21', '2026-09-27')).toBe(false);
  });

  it('compareMeals orders by day, then breakfast to dinner', () => {
    const meals = [
      meal('2026-09-22', MealSlot.Breakfast),
      meal('2026-09-21', MealSlot.Dinner),
      meal('2026-09-21', MealSlot.Breakfast),
      meal('2026-09-21', MealSlot.Snack),
    ];

    expect(meals.sort(compareMeals).map((m) => `${m.date} ${m.slot}`)).toEqual([
      '2026-09-21 breakfast',
      '2026-09-21 snack',
      '2026-09-21 dinner',
      '2026-09-22 breakfast',
    ]);
  });
});
