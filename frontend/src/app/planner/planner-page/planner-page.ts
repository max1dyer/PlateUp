import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, today, toLocalDate } from '../../core/calendar-date';
import { PreferencesService } from '../../preferences/preferences.service';
import { AddMealForm } from '../add-meal-form/add-meal-form';
import { PlannedMealCard } from '../planned-meal-card/planned-meal-card';
import {
  clampToRange,
  dayHeading,
  isInRange,
  mealNutrition,
  planningRange,
  totalNutrition,
  weekDays,
  weekLabel,
} from '../planner-week';
import { MEAL_SLOTS, MealSlot, PlannedMeal } from '../planner.models';
import { PlannerService } from '../planner.service';
import { WeekGroceryPanel } from '../week-grocery-panel/week-grocery-panel';

/** One day button in the week strip. */
interface DayTab {
  date: string;
  /** Short weekday, e.g. "Mon". */
  weekday: string;
  /** Day of the month, e.g. 21. */
  dayOfMonth: number;
  /** How many meals are planned that day. */
  mealCount: number;
  /** False for days beyond the half-year planning range (only in the first and last weeks). */
  inRange: boolean;
}

/**
 * "Your Planner" page (`/planner`, UC1, UC4): a week strip to pick a day, the
 * day's nutrition against the user's calorie goal, and its meals grouped by
 * meal time. The user can go to any day from half a year before today to half
 * a year after; the chosen day is kept in the address (`?date=`). The week's
 * ingredients can be added to a grocery list in one step (UC6).
 */
@Component({
  selector: 'app-planner-page',
  imports: [AddMealForm, PlannedMealCard, WeekGroceryPanel],
  templateUrl: './planner-page.html',
  styleUrl: './planner-page.css',
})
export class PlannerPage implements OnInit {
  /** Today's date, fixed when the page opens. */
  protected readonly today = today();
  /** The days the planner can show. */
  protected readonly range = planningRange(this.today);

  /** The day whose meals are shown. */
  protected readonly selected = signal(this.today);
  /** Meals planned in the selected day's week. */
  protected readonly meals = signal<PlannedMeal[]>([]);
  /** True while the week's meals are loading. */
  protected readonly loading = signal(true);
  /** True if the week could not be loaded (the page offers a retry). */
  protected readonly loadError = signal(false);
  /** The meal time whose add form is open, or null when it is closed. */
  protected readonly addingTo = signal<MealSlot | null>(null);
  /** True while the "Shop for this week" panel is open. */
  protected readonly shopping = signal(false);

  /** The seven days of the selected week, Monday first. */
  protected readonly week = computed(() => weekDays(this.selected()));
  /** The week's heading, e.g. "September 21–27, 2026". */
  protected readonly weekTitle = computed(() => weekLabel(this.week()[0]));
  /** One tab per day, with how many meals each has. */
  protected readonly dayTabs = computed<DayTab[]>(() =>
    this.week().map((date) => {
      const local = toLocalDate(date);
      return {
        date,
        weekday: local.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: local.getDate(),
        mealCount: this.meals().filter((meal) => meal.date === date).length,
        inRange: isInRange(date, this.range),
      };
    }),
  );
  /** A one-line summary of the week, e.g. "5 meals planned · 3 days still open". */
  protected readonly weekSummary = computed(() => {
    const planned = this.meals().length;
    const open = this.dayTabs().filter((day) => day.mealCount === 0).length;
    const meals = `${planned} ${planned === 1 ? 'meal' : 'meals'} planned`;
    return open === 0 ? `${meals} · every day has a plan` : `${meals} · ${open} days still open`;
  });
  /** False on the earliest week the range allows. */
  protected readonly canGoBack = computed(() => this.week()[0] > this.range.min);
  /** False on the latest week the range allows. */
  protected readonly canGoForward = computed(() => this.week()[6] < this.range.max);

  /** The selected day's heading, e.g. "Today, September 21". */
  protected readonly dayTitle = computed(() => dayHeading(this.selected(), this.today));
  /** The nutrition card's title, e.g. "Today’s nutrition" or "Monday’s nutrition". */
  protected readonly nutritionTitle = computed(
    () => `${this.dayTitle().split(',')[0]}’s nutrition`,
  );
  /** The selected day's meals. */
  protected readonly dayMeals = computed(() =>
    this.meals().filter((meal) => meal.date === this.selected()),
  );
  /** The selected day's meals grouped by meal time, with each group's calories. */
  protected readonly slotGroups = computed(() =>
    MEAL_SLOTS.map(({ value, label }) => {
      const meals = this.dayMeals().filter((meal) => meal.slot === value);
      return {
        slot: value,
        label,
        meals,
        calories: meals.reduce((sum, meal) => sum + mealNutrition(meal).calories, 0),
      };
    }),
  );

  /** Everything planned for the selected day, counting every serving. */
  protected readonly planned = computed(() => totalNutrition(this.dayMeals()));
  /** The calories from meals already marked eaten. */
  protected readonly eatenCalories = computed(
    () => totalNutrition(this.dayMeals().filter((meal) => meal.eaten)).calories,
  );
  /** The user's daily calorie goal (set or derived), or null without one. */
  protected readonly calorieGoal = computed(
    () => this.preferences.preferences()?.dailyTargets.calories ?? null,
  );
  /** The user's preferred servings for new meals, or null until preferences load. */
  protected readonly preferencesServings = computed(
    () => this.preferences.preferences()?.defaultServings ?? null,
  );
  /** Widths (as % of the goal) of the eaten and still-planned parts of the progress bar. */
  protected readonly progress = computed(() => {
    const goal = this.calorieGoal();
    if (goal === null || goal === 0) {
      return null;
    }
    const percent = (kcal: number): number => Math.min(100, (kcal / goal) * 100);
    const eaten = percent(this.eatenCalories());
    return { eaten, planned: Math.max(0, percent(this.planned().calories) - eaten) };
  });

  constructor(
    private readonly planner: PlannerService,
    private readonly preferences: PreferencesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  /** Opens the day in the address (if it is in range) or today, and loads its week. */
  public ngOnInit(): void {
    const wanted = this.route.snapshot.queryParamMap.get('date');
    if (wanted !== null && /^\d{4}-\d{2}-\d{2}$/.test(wanted) && isInRange(wanted, this.range)) {
      this.selected.set(wanted);
    }
    this.preferences.load().subscribe();
    this.loadWeek();
  }

  /** Fetches the meals for the selected day's week. */
  protected loadWeek(): void {
    const days = this.week();
    this.loading.set(true);
    this.loadError.set(false);
    this.planner.getMeals(days[0], days[6]).subscribe({
      next: (meals) => {
        this.meals.set(meals);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  /**
   * Shows `date` (kept within the planning range), reloading the meals when
   * it is in a different week, and keeps the address in step.
   */
  protected goTo(date: string): void {
    const target = clampToRange(date, this.range);
    const sameWeek = this.week().includes(target);
    this.selected.set(target);
    this.addingTo.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: target },
      replaceUrl: true,
    });
    if (!sameWeek) {
      // The shopping panel belongs to the week it was opened for.
      this.shopping.set(false);
      this.loadWeek();
    }
  }

  /** Moves a whole week back (-1) or forward (+1), keeping the same weekday. */
  protected shiftWeek(direction: -1 | 1): void {
    this.goTo(addDays(this.selected(), direction * 7));
  }

  /** Jumps to the day picked in the date field (ignored while the field is empty). */
  protected onDatePicked(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value !== '') {
      this.goTo(value);
    }
  }

  /** Adds a newly planned meal, which is always on the selected day. */
  protected onPlanned(meal: PlannedMeal): void {
    this.meals.update((meals) => [...meals, meal]);
    this.addingTo.set(null);
  }

  /**
   * Replaces a changed meal. A meal moved to another week is dropped from
   * this one; it appears when that week is opened.
   */
  protected onChanged(meal: PlannedMeal): void {
    const inWeek = this.week().includes(meal.date);
    this.meals.update((meals) =>
      inWeek
        ? meals.map((existing) => (existing.id === meal.id ? meal : existing))
        : meals.filter((existing) => existing.id !== meal.id),
    );
  }

  /** Drops a removed meal from the page. */
  protected onRemoved(mealId: string): void {
    this.meals.update((meals) => meals.filter((meal) => meal.id !== mealId));
  }
}
