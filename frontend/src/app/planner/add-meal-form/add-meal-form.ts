import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { filterRecipes } from '../../recipes/recipe-filter';
import { Recipe } from '../../recipes/recipe.models';
import { RecipesService } from '../../recipes/recipes.service';
import { dayHeading } from '../planner-week';
import { MAX_PLANNED_SERVINGS, MEAL_SLOTS, MealSlot, PlannedMeal } from '../planner.models';
import { PlannerService } from '../planner.service';

/** How many matching recipes the search shows at once. */
const MAX_RESULTS = 6;

/**
 * Inline form for planning a meal (UC1): search recipes by name or
 * ingredient, pick one, then choose the meal time and servings (starting at
 * the user's preferred serving size).
 */
@Component({
  selector: 'app-add-meal-form',
  imports: [ReactiveFormsModule],
  templateUrl: './add-meal-form.html',
  styleUrl: './add-meal-form.css',
})
export class AddMealForm implements OnInit {
  /** The day the meal is planned for (`YYYY-MM-DD`). */
  public readonly date = input.required<string>();
  /** Today's date, for wording such as "Tomorrow" in the confirmation. */
  public readonly today = input.required<string>();
  /** The meal time to start with (the one whose "+ Add" was clicked). */
  public readonly slot = input<MealSlot>('dinner');
  /** The user's preferred servings, or null to use each recipe's own servings. */
  public readonly defaultServings = input<number | null>(null);
  /** Emits the new meal once it is planned. */
  public readonly planned = output<PlannedMeal>();
  /** Emits when the user closes the form. */
  public readonly closed = output<void>();

  protected readonly slots = MEAL_SLOTS;
  protected readonly maxServings = MAX_PLANNED_SERVINGS;
  /** Every recipe the user can see, as loaded. */
  protected readonly recipes = signal<Recipe[]>([]);
  /** True until the recipes have loaded. */
  protected readonly loading = signal(true);
  /** Text typed in the recipe search box. */
  protected readonly search = signal('');
  /** The recipe picked from the results, or null while still searching. */
  protected readonly chosen = signal<Recipe | null>(null);
  /** True while the meal is being saved. */
  protected readonly saving = signal(false);
  /** The last validation or server error to show, or null. */
  protected readonly error = signal<string | null>(null);

  /** The first few recipes whose title, tags, or ingredients match the search. */
  protected readonly results = computed(() =>
    filterRecipes(this.recipes(), this.search(), null).slice(0, MAX_RESULTS),
  );

  /** Meal time and servings for the chosen recipe. */
  protected readonly form = new FormGroup({
    slot: new FormControl<MealSlot>('dinner', { nonNullable: true }),
    servings: new FormControl<number | null>(null),
  });

  constructor(
    private readonly recipesService: RecipesService,
    private readonly planner: PlannerService,
    private readonly toasts: ToastService,
  ) {}

  /** Starts on the requested meal time and loads the recipes to choose from. */
  public ngOnInit(): void {
    this.form.controls.slot.setValue(this.slot());
    this.recipesService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes.set(recipes);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  /** Updates the search text as the user types. */
  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Picks a recipe and suggests the preferred servings (or the recipe's own). */
  protected choose(recipe: Recipe): void {
    this.chosen.set(recipe);
    this.form.controls.servings.setValue(this.defaultServings() ?? recipe.servings);
    this.error.set(null);
  }

  /** Plans the chosen recipe on the day and confirms it with a toast. */
  protected submit(): void {
    const recipe = this.chosen();
    const { slot, servings } = this.form.getRawValue();
    if (!recipe) {
      this.error.set('Choose a recipe.');
      return;
    }
    if (servings === null) {
      this.error.set('Servings must be a whole number of 1 or more.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.planner.planMeal({ recipeId: recipe.id, date: this.date(), slot, servings }).subscribe({
      next: (meal) => {
        this.saving.set(false);
        const label = MEAL_SLOTS.find((option) => option.value === meal.slot)?.label;
        const count = `${meal.servings} ${meal.servings === 1 ? 'serving' : 'servings'}`;
        this.toasts.success(
          `${meal.recipe.title} is planned for ${dayHeading(meal.date, this.today())} ` +
            `(${label}, ${count}).`,
        );
        this.planned.emit(meal);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
