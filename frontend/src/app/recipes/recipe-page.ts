import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { errorMessage } from '../core/api';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';
import { formatQuantity, scaleQuantity } from '../grocery-list/grocery-list-format';
import { DIETARY_DISCLAIMER } from '../preferences/preferences.models';
import { PreferencesService } from '../preferences/preferences.service';
import { UsersService } from '../users/users.service';
import { AddToGroceryPanel } from './add-to-grocery-panel';
import { dietWarnings } from './recipe-filter';
import { Recipe, RecipeIngredient } from './recipe.models';
import { RecipesService } from './recipes.service';
import { ReviewForm } from './review-form';
import { SaveButton } from './save-button';

/** Shown for users whose profile cannot be loaded (e.g. a deleted account). */
export const UNKNOWN_USER = 'Unknown user';

/** Most servings the stepper offers. */
export const MAX_SERVINGS = 50;

type NameEntry = [userId: string, displayName: string];

/** One "share of your daily goal" figure, e.g. { label: 'protein', percent: 30 }. */
export interface GoalShare {
  label: string;
  percent: number;
}

/**
 * Full view of one recipe (`/recipes/:recipeId`, UC18): ingredients scaled to
 * the chosen servings (starting at the user's preferred servings, UC10),
 * dietary warnings, nutrition against the user's daily goals, steps, and reviews. From here the user can save it,
 * add it to a grocery list, review it, or (as its author) edit or delete it.
 */
@Component({
  selector: 'app-recipe-page',
  imports: [DatePipe, RouterLink, AddToGroceryPanel, ReviewForm, SaveButton],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.css',
})
export class RecipePage {
  protected readonly recipe = signal<Recipe | null>(null);
  protected readonly loadError = signal(false);
  protected readonly servings = signal(1);
  protected readonly addingToGrocery = signal(false);
  protected readonly confirmingDelete = signal(false);
  /** Display names of the author and reviewers, by user id. */
  private readonly names = signal<ReadonlyMap<string, string>>(new Map());

  protected readonly maxServings = MAX_SERVINGS;
  protected readonly disclaimer = DIETARY_DISCLAIMER;

  /** Warnings for each of the user's dietary restrictions this recipe breaks. */
  protected readonly dietWarnings = computed(() => {
    const recipe = this.recipe();
    const restrictions = this.preferences.preferences()?.dietaryRestrictions ?? [];
    return recipe ? dietWarnings(recipe, restrictions) : [];
  });

  /** What one serving contributes to each daily goal the user has set. */
  protected readonly goalShares = computed<GoalShare[]>(() => {
    const nutrition = this.recipe()?.nutrition;
    const targets = this.preferences.preferences()?.dailyTargets;
    if (!nutrition || !targets) {
      return [];
    }
    const shares: [string, number, number | null][] = [
      ['calories', nutrition.calories, targets.calories],
      ['protein', nutrition.protein, targets.protein],
      ['carbs', nutrition.carbohydrates, targets.carbohydrates],
      ['fat', nutrition.fat, targets.fat],
    ];
    return shares
      .filter((share): share is [string, number, number] => share[2] !== null && share[2] > 0)
      .map(([label, amount, target]) => ({ label, percent: Math.round((amount / target) * 100) }));
  });
  protected readonly formatQuantity = formatQuantity;

  /** Ingredients the user has marked as already being in their pantry. */
  protected readonly pantryIngredients = signal<ReadonlySet<string>>(new Set());

  protected readonly pantryCount = computed(() => this.pantryIngredients().size);

  protected readonly missingIngredients = computed(() =>
    this.scaledIngredients().filter((ingredient) => !this.pantryIngredients().has(ingredient.name)),
  );

  protected readonly missingCount = computed(() => this.missingIngredients().length);

  protected readonly ingredientsToAdd = signal<RecipeIngredient[]>([]);

  protected readonly isAuthor = computed(() => this.recipe()?.authorId === this.session.userId());
  protected readonly myReview = computed(
    () =>
      this.recipe()?.reviews.find((review) => review.reviewerId === this.session.userId()) ?? null,
  );
  protected readonly scaledIngredients = computed<RecipeIngredient[]>(() => {
    const recipe = this.recipe();
    if (!recipe) {
      return [];
    }
    const factor = this.servings() / recipe.servings;
    return recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: scaleQuantity(ingredient.quantity, factor),
    }));
  });
  /** Whole stars to show for the average rating, e.g. "★★★★☆". */
  protected readonly starText = computed(() => {
    const rating = Math.round(this.recipe()?.rating ?? 0);
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  });

  constructor(
    route: ActivatedRoute,
    private readonly recipes: RecipesService,
    private readonly users: UsersService,
    private readonly session: SessionService,
    private readonly toasts: ToastService,
    private readonly router: Router,
    private readonly preferences: PreferencesService,
  ) {
    route.paramMap
      .pipe(
        map((params) => params.get('recipeId') ?? ''),
        switchMap((recipeId) => {
          this.recipe.set(null);
          this.loadError.set(false);
          this.addingToGrocery.set(false);
          return this.recipes.getRecipe(recipeId).pipe(catchError(() => of(null)));
        }),
        switchMap((recipe) =>
          recipe
            ? forkJoin({
                names: this.lookUpNames(recipe),
                preferences: this.preferences.load(),
              }).pipe(map(({ names, preferences }) => ({ recipe, names, preferences })))
            : of(null),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((loaded) => {
        this.loadError.set(loaded === null);
        if (loaded) {
          this.names.set(loaded.names);
          // Open at the user's preferred servings; without preferences, as written.
          this.servings.set(loaded.preferences?.defaultServings ?? loaded.recipe.servings);
          this.recipe.set(loaded.recipe);
        }
      });
  }

  protected nameOf(userId: string): string {
    if (userId === this.session.userId()) {
      return 'You';
    }
    return this.names().get(userId) ?? UNKNOWN_USER;
  }

  protected changeServings(delta: number): void {
    this.servings.update((current) => Math.min(MAX_SERVINGS, Math.max(1, current + delta)));
  }

  protected onReviewed(recipe: Recipe): void {
    this.recipe.set(recipe);
  }

  protected deleteRecipe(): void {
    const recipe = this.recipe();
    if (!recipe) {
      return;
    }
    this.recipes.deleteRecipe(recipe.id).subscribe({
      next: () => {
        this.toasts.success(`Deleted ${recipe.title}`);
        void this.router.navigateByUrl('/recipes');
      },
      error: (error: unknown) => this.toasts.error(errorMessage(error)),
    });
  }

  /**
   * Recipes only carry user ids, so look up the names to show. A failed
   * lookup is not an error for the page; that user just shows as unknown.
   */
  private lookUpNames(recipe: Recipe): Observable<ReadonlyMap<string, string>> {
    const reviewerIds = recipe.reviews.map((review) => review.reviewerId);
    const lookups = [...new Set([recipe.authorId, ...reviewerIds])].filter(
      (userId) => userId !== this.session.userId(),
    );
    if (lookups.length === 0) {
      return of(new Map());
    }
    return forkJoin(
      lookups.map((userId) =>
        this.users.getUser(userId).pipe(
          map((user): NameEntry => [userId, user.displayName]),
          catchError(() => of(null)),
        ),
      ),
    ).pipe(
      map((entries) => new Map(entries.filter((entry): entry is NameEntry => entry !== null))),
    );
  }

  protected togglePantryStatus(ingredientName: string): void {
    this.pantryIngredients.update((current) => {
      const updated = new Set(current);

      if (updated.has(ingredientName)) {
        updated.delete(ingredientName);
      } else {
        updated.add(ingredientName);
      }

      return updated;
    });
  }

  protected isInPantry(ingredientName: string): boolean {
    return this.pantryIngredients().has(ingredientName);
  }

  protected addMissingToGrocery(): void {
    this.ingredientsToAdd.set(this.missingIngredients());
    this.addingToGrocery.set(true);
  }

  protected addAllToGrocery(): void {
    this.ingredientsToAdd.set(this.scaledIngredients());
    this.addingToGrocery.set(true);
  }
}
