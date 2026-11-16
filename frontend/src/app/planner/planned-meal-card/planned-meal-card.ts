import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { PlanningRange, dayHeading, mealNutrition } from '../planner-week';
import {
  MAX_PLANNED_SERVINGS,
  MEAL_SLOTS,
  MealSlot,
  PlannedMeal,
  PlannedMealChanges,
} from '../planner.models';
import { PlannerService } from '../planner.service';

/**
 * One planned meal on the planner (UC1, UC4): the recipe with its servings and
 * nutrition, a button to mark it eaten (or undo that), and an edit panel to
 * move it to another day or meal time, change servings, or remove it.
 */
@Component({
  selector: 'app-planned-meal-card',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './planned-meal-card.html',
  styleUrl: './planned-meal-card.css',
})
export class PlannedMealCard {
  /** The meal shown on this card. */
  public readonly meal = input.required<PlannedMeal>();
  /** The days the meal may be moved to. */
  public readonly range = input.required<PlanningRange>();
  /** Today's date, for wording such as "Tomorrow" in messages. */
  public readonly today = input.required<string>();
  /** Alternates the card colour, like the grocery list's category cards. */
  public readonly green = input(false);
  /** Emits the saved meal after any change (eaten, moved, or new servings). */
  public readonly changed = output<PlannedMeal>();
  /** Emits the meal's id after it is removed. */
  public readonly removed = output<string>();

  protected readonly slots = MEAL_SLOTS;
  protected readonly maxServings = MAX_PLANNED_SERVINGS;
  /** Calories and macros for the planned servings. */
  protected readonly nutrition = computed(() => mealNutrition(this.meal()));
  /** True while the edit panel is open. */
  protected readonly editing = signal(false);
  /** True while the "Remove from planner?" confirmation is showing. */
  protected readonly confirmingRemove = signal(false);
  /** True while a change is being sent (disables the buttons). */
  protected readonly saving = signal(false);
  /** The last error to show on the card, or null. */
  protected readonly error = signal<string | null>(null);

  /** The edit panel: the day, meal time, and servings. */
  protected readonly form = new FormGroup({
    date: new FormControl('', { nonNullable: true }),
    slot: new FormControl<MealSlot>('lunch', { nonNullable: true }),
    servings: new FormControl<number | null>(1),
  });

  constructor(
    private readonly planner: PlannerService,
    private readonly toasts: ToastService,
  ) {}

  /** Marks the meal eaten, or back to planned when it already is. */
  protected toggleEaten(): void {
    this.send({ eaten: !this.meal().eaten });
  }

  /** Opens the edit panel, filled with the meal's current day, meal time, and servings. */
  protected startEditing(): void {
    const meal = this.meal();
    this.form.setValue({ date: meal.date, slot: meal.slot, servings: meal.servings });
    this.error.set(null);
    this.confirmingRemove.set(false);
    this.editing.set(true);
  }

  /** Saves the edit panel, confirming a move with the meal's new day and meal time. */
  protected save(): void {
    const { date, slot, servings } = this.form.getRawValue();
    if (date === '') {
      this.error.set('Choose a day.');
      return;
    }
    if (servings === null) {
      this.error.set('Servings must be a whole number of 1 or more.');
      return;
    }
    const before = this.meal();
    const moved = date !== before.date || slot !== before.slot;
    this.send({ date, slot, servings }, (saved) => {
      this.editing.set(false);
      this.toasts.success(
        moved
          ? `${saved.recipe.title} moved to ${this.describe(saved.date, saved.slot)}`
          : `${saved.recipe.title} updated`,
      );
    });
  }

  /** Removes the meal from the planner (after the confirmation step). */
  protected remove(): void {
    const meal = this.meal();
    this.saving.set(true);
    this.planner.removeMeal(meal.id).subscribe({
      next: () => {
        this.toasts.success(`Removed ${meal.recipe.title} from your planner`);
        this.removed.emit(meal.id);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** Sends `changes`, then runs `onSaved` and emits the saved meal. */
  private send(changes: PlannedMealChanges, onSaved?: (saved: PlannedMeal) => void): void {
    this.saving.set(true);
    this.error.set(null);
    this.planner.updateMeal(this.meal().id, changes).subscribe({
      next: (saved) => {
        this.saving.set(false);
        onSaved?.(saved);
        this.changed.emit(saved);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** "Tomorrow, September 22 (Dinner)": a day and meal time for messages. */
  private describe(date: string, slot: MealSlot): string {
    const label = MEAL_SLOTS.find((option) => option.value === slot)?.label ?? slot;
    return `${dayHeading(date, this.today())} (${label})`;
  }

  /** Stops the spinner and shows the backend's error message. */
  private fail(error: unknown): void {
    this.saving.set(false);
    this.error.set(errorMessage(error));
  }
}
