import { Component, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, startWith } from 'rxjs';
import { errorMessage } from '../../core/api';
import { readImageFile } from '../../core/image-file';
import { ToastService } from '../../core/toast.service';
import { UNITS, Unit } from '../../grocery-list/grocery-list.models';
import { NewRecipe, Recipe } from '../recipe.models';
import { RecipesService } from '../recipes.service';

/** The form controls for one ingredient row. */
type IngredientGroup = FormGroup<{
  name: FormControl<string>;
  amount: FormControl<number | null>;
  unit: FormControl<Unit>;
}>;

/** Builds the controls for one ingredient row, empty by default. */
function ingredientGroup(
  name = '',
  amount: number | null = null,
  unit: Unit = 'piece',
): IngredientGroup {
  return new FormGroup({
    name: new FormControl(name, { nonNullable: true }),
    amount: new FormControl<number | null>(amount),
    unit: new FormControl<Unit>(unit, { nonNullable: true }),
  });
}

/** Builds the control for one method step, empty by default. */
function stepControl(text = ''): FormControl<string> {
  return new FormControl(text, { nonNullable: true });
}

/**
 * Manual recipe upload (`/recipes/new`, UC3) and editing (`/recipes/:id/edit`,
 * UC20): title, photo, servings, ingredients, steps, nutrition, and tags.
 * The backend validates everything; its message is shown if it refuses.
 */
@Component({
  selector: 'app-recipe-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-form-page.html',
  styleUrl: './recipe-form-page.css',
})
export class RecipeFormPage implements OnInit {
  /** The recipe being edited, or null when uploading a new one. */
  protected readonly editing = signal<Recipe | null>(null);
  /** True while the recipe being edited is loading. */
  protected readonly loading = signal(false);
  /** True while the recipe is being saved. */
  protected readonly saving = signal(false);
  /** The first problem to fix, or the backend's error message; null when there is none. */
  protected readonly error = signal<string | null>(null);
  protected readonly units = UNITS;

  /** The whole recipe form. A new recipe starts with one empty ingredient and one empty step. */
  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    thumbnailUrl: new FormControl('', { nonNullable: true }),
    servings: new FormControl<number | null>(2),
    prepTimeMinutes: new FormControl<number | null>(30),
    visibility: new FormControl<'public' | 'private'>('public', { nonNullable: true }),
    tags: new FormControl('', { nonNullable: true }),
    ingredients: new FormArray<IngredientGroup>([ingredientGroup()]),
    steps: new FormArray<FormControl<string>>([stepControl()]),
    calories: new FormControl<number | null>(0),
    protein: new FormControl<number | null>(0),
    fat: new FormControl<number | null>(0),
    carbohydrates: new FormControl<number | null>(0),
  });

  /**
   * The photo as a signal. The app is zoneless, so the FileReader callback
   * that sets the control would not otherwise re-render the preview.
   */
  protected readonly photo = toSignal(
    this.form.controls.thumbnailUrl.valueChanges.pipe(
      startWith(this.form.controls.thumbnailUrl.value),
    ),
    { requireSync: true },
  );

  constructor(
    private readonly recipes: RecipesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toasts: ToastService,
  ) {}

  /** The ingredient rows, for the template's `@for` and the add/remove buttons. */
  protected get ingredients(): FormArray<IngredientGroup> {
    return this.form.controls.ingredients;
  }

  /** The method steps, for the template's `@for` and the add/remove/move buttons. */
  protected get steps(): FormArray<FormControl<string>> {
    return this.form.controls.steps;
  }

  /** On the edit route, loads the recipe and fills the form with it. */
  public ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('recipeId');
    if (recipeId) {
      this.loading.set(true);
      this.recipes.getRecipe(recipeId).subscribe({
        next: (recipe) => {
          this.fill(recipe);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(errorMessage(error));
        },
      });
    }
  }

  /** Adds an empty ingredient row at the end. */
  protected addIngredient(): void {
    this.ingredients.push(ingredientGroup());
  }

  /** Removes the ingredient row at `index`. */
  protected removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  /** Adds an empty step at the end. */
  protected addStep(): void {
    this.steps.push(stepControl());
  }

  /** Removes the step at `index`. */
  protected removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  /** Moves a step up (-1) or down (+1) one place. */
  protected moveStep(index: number, offset: -1 | 1): void {
    const control = this.steps.at(index);
    this.steps.removeAt(index);
    this.steps.insert(index + offset, control);
  }

  /** Reads the chosen photo into the form as a data URL, or shows why it was refused. */
  protected onPhotoChosen(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    readImageFile(file).then(
      (dataUrl) => this.form.controls.thumbnailUrl.setValue(dataUrl),
      (error: Error) => this.error.set(error.message),
    );
  }

  /** Clears the photo. */
  protected removePhoto(): void {
    this.form.controls.thumbnailUrl.setValue('');
  }

  /** Checks the form, then creates the recipe or saves the edit and opens the recipe's page. */
  protected submit(): void {
    const recipe = this.toNewRecipe();
    // A string means the form has a problem to show instead of a request body.
    if (typeof recipe === 'string') {
      this.error.set(recipe);
      return;
    }
    const existing = this.editing();
    const request: Observable<Recipe> = existing
      ? this.recipes.updateRecipe(existing.id, recipe)
      : this.recipes.createRecipe(recipe);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toasts.success(existing ? 'Recipe updated' : `${saved.title} is uploaded`);
        void this.router.navigate(['/recipes', saved.id]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  /** Puts an existing recipe into the form, replacing the ingredient and step rows. */
  private fill(recipe: Recipe): void {
    this.editing.set(recipe);
    this.ingredients.clear();
    recipe.ingredients.forEach((ingredient) =>
      this.ingredients.push(
        ingredientGroup(ingredient.name, ingredient.quantity.amount, ingredient.quantity.unit),
      ),
    );
    this.steps.clear();
    recipe.steps.forEach((step) => this.steps.push(stepControl(step)));
    this.form.patchValue({
      title: recipe.title,
      description: recipe.description,
      thumbnailUrl: recipe.thumbnailUrl ?? '',
      servings: recipe.servings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      visibility: recipe.visibility,
      tags: recipe.tags.join(', '),
      ...recipe.nutrition,
    });
  }

  /** The request body, or a message describing the first problem the user must fix. */
  private toNewRecipe(): NewRecipe | string {
    const value = this.form.getRawValue();
    if (value.title.trim().length === 0) {
      return 'Give the recipe a title.';
    }
    // Blank ingredient rows and steps are ignored rather than treated as errors.
    const ingredients = value.ingredients.filter((row) => row.name.trim().length > 0);
    if (ingredients.length === 0) {
      return 'Add at least one ingredient.';
    }
    const missingAmount = ingredients.find((row) => row.amount === null);
    if (missingAmount) {
      return `Enter an amount for ${missingAmount.name.trim()}.`;
    }
    const steps = value.steps.filter((step) => step.trim().length > 0);
    if (steps.length === 0) {
      return 'Add at least one step.';
    }
    return {
      title: value.title,
      description: value.description,
      thumbnailUrl: value.thumbnailUrl.trim() || null,
      visibility: value.visibility,
      servings: value.servings ?? 0,
      prepTimeMinutes: value.prepTimeMinutes ?? 0,
      // Tags are typed as one comma-separated field.
      tags: value.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      ingredients: ingredients.map((row) => ({
        name: row.name,
        quantity: { amount: row.amount ?? 0, unit: row.unit },
      })),
      steps,
      nutrition: {
        calories: value.calories ?? 0,
        protein: value.protein ?? 0,
        fat: value.fat ?? 0,
        carbohydrates: value.carbohydrates ?? 0,
      },
    };
  }
}
