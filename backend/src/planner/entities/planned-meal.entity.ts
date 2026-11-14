import { requireCalendarDate } from '../../common/domain/calendar-date';
import {
  requireBoolean,
  requireIntegerInRange,
  requireOneOf,
  requireText,
} from '../../common/domain/guards';
import { OwnedEntity } from '../../common/domain/owned.entity';

/** The meal times a day is split into (UC1). Declaration order is the display order. */
export enum MealSlot {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Snack = 'snack',
  Dinner = 'dinner',
}

/** Most servings one planned meal can have. */
export const MAX_PLANNED_SERVINGS = 50;

/** The fields a planned meal serializes to. */
export interface PlannedMealSnapshot {
  ownerId: string;
  recipeId: string;
  /** The day the meal is planned for (`YYYY-MM-DD`). */
  date: string;
  slot: MealSlot;
  /** Servings to cook; the recipe's ingredients and nutrition are scaled to this. */
  servings: number;
  /** True once the user has marked the meal as eaten (UC4). */
  eaten: boolean;
}

/** The fields of a planned meal that can be edited; omitted fields stay unchanged. */
export type PlannedMealChanges = Partial<
  Pick<PlannedMealSnapshot, 'date' | 'slot' | 'servings' | 'eaten'>
>;

/**
 * One recipe planned for a day and meal time in a user's weekly planner
 * (UC1), with the servings to cook and whether it has been eaten (UC4).
 * Several recipes may share a meal time (e.g. a main and a side).
 */
export class PlannedMeal extends OwnedEntity<PlannedMealSnapshot> {
  public readonly recipeId: string;
  private mealDate: string;
  private mealSlot: MealSlot;
  private mealServings: number;
  private isEaten = false;

  /** @throws DomainValidationError if the date, meal time, or servings are invalid. */
  constructor(ownerId: string, recipeId: string, date: string, slot: MealSlot, servings: number) {
    super(ownerId);
    this.recipeId = requireText(recipeId, 'Recipe');
    this.mealDate = requireCalendarDate(date, 'Date');
    this.mealSlot = requireOneOf(slot, MealSlot, 'meal');
    this.mealServings = PlannedMeal.validateServings(servings);
  }

  /** The day the meal is planned for (`YYYY-MM-DD`). */
  public get date(): string {
    return this.mealDate;
  }

  /** The meal time it is planned for. */
  public get slot(): MealSlot {
    return this.mealSlot;
  }

  /** Servings to cook. */
  public get servings(): number {
    return this.mealServings;
  }

  /** True once the meal has been marked as eaten. */
  public get eaten(): boolean {
    return this.isEaten;
  }

  /** True if the meal falls between `from` and `to` (`YYYY-MM-DD`, both inclusive). */
  public isBetween(from: string, to: string): boolean {
    // YYYY-MM-DD strings compare in date order.
    return this.mealDate >= from && this.mealDate <= to;
  }

  /**
   * Moves the meal, changes its servings, or marks it eaten or not eaten.
   * Every change is validated before any is applied.
   */
  public update(changes: PlannedMealChanges): void {
    const date =
      changes.date === undefined ? this.mealDate : requireCalendarDate(changes.date, 'Date');
    const slot =
      changes.slot === undefined ? this.mealSlot : requireOneOf(changes.slot, MealSlot, 'meal');
    const servings =
      changes.servings === undefined
        ? this.mealServings
        : PlannedMeal.validateServings(changes.servings);
    const eaten =
      changes.eaten === undefined ? this.isEaten : requireBoolean(changes.eaten, 'Eaten');

    this.mealDate = date;
    this.mealSlot = slot;
    this.mealServings = servings;
    this.isEaten = eaten;
    this.touch();
  }

  /** The meal-specific fields for `toJSON()`. */
  protected snapshot(): PlannedMealSnapshot {
    return {
      ownerId: this.ownerId,
      recipeId: this.recipeId,
      date: this.mealDate,
      slot: this.mealSlot,
      servings: this.mealServings,
      eaten: this.isEaten,
    };
  }

  /** Servings must be a whole number from 1 to `MAX_PLANNED_SERVINGS`. */
  private static validateServings(servings: number): number {
    return requireIntegerInRange(servings, 1, MAX_PLANNED_SERVINGS, 'Servings');
  }
}

/**
 * Orders meals by day, then by meal time (breakfast first), so a week reads
 * top to bottom. Meals sharing a slot keep the order they were planned in.
 */
export function compareMeals(a: PlannedMeal, b: PlannedMeal): number {
  const slots = Object.values(MealSlot);
  return (
    a.date.localeCompare(b.date) ||
    slots.indexOf(a.slot) - slots.indexOf(b.slot) ||
    a.createdAt.getTime() - b.createdAt.getTime()
  );
}
