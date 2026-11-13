import { Component, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, startWith } from 'rxjs';
import { errorMessage } from '../core/api';
import { readImageFile } from '../core/image-file';
import { ToastService } from '../core/toast.service';
import { UNITS, Unit } from '../grocery-list/grocery-list.models';
import { NewRecipe, Recipe } from './recipe.models';
import { RecipesService } from './recipes.service';

type IngredientGroup = FormGroup<{
  name: FormControl<string>;
  amount: FormControl<number | null>;
  unit: FormControl<Unit>;
}>;

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
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly units = UNITS;

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

  protected get ingredients(): FormArray<IngredientGroup> {
    return this.form.controls.ingredients;
  }

  protected get steps(): FormArray<FormControl<string>> {
    return this.form.controls.steps;
  }

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

  protected addIngredient(): void {
    this.ingredients.push(ingredientGroup());
  }

  protected removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  protected addStep(): void {
    this.steps.push(stepControl());
  }

  protected removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  protected moveStep(index: number, offset: -1 | 1): void {
    const control = this.steps.at(index);
    this.steps.removeAt(index);
    this.steps.insert(index + offset, control);
  }

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

  protected removePhoto(): void {
    this.form.controls.thumbnailUrl.setValue('');
  }

  protected submit(): void {
    const recipe = this.toNewRecipe();
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
