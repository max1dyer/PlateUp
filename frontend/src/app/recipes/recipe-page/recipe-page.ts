import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { errorMessage } from '../../core/api';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { formatQuantity, scaleQuantity } from '../../grocery-list/grocery-list-format';
import { StockLevel } from '../../pantry/pantry.models';
import { PantryService } from '../../pantry/pantry.service';
import {
  DIETARY_DISCLAIMER,
  activeBudget,
  formatMoney,
} from '../../preferences/preferences.models';
import { PreferencesService } from '../../preferences/preferences.service';
import { UsersService } from '../../users/users.service';
import { AddToGroceryPanel, GroceryAddition } from '../add-to-grocery-panel/add-to-grocery-panel';
import { IngredientStock, defaultSelection, stockRows } from '../pantry-stock';
import { dietWarnings, isOverBudget } from '../recipe-filter';
import { Recipe, RecipeIngredient, SharedWithUser } from '../recipe.models';
import { RecipesService } from '../recipes.service';
import { ReviewForm } from '../review-form/review-form';
import { SaveButton } from '../save-button/save-button';
import { StarRating } from '../star-rating/star-rating';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RecipeSharesService } from '../recipe-shares.service';

/** Shown for users whose profile cannot be loaded (e.g. a deleted account). */
export const UNKNOWN_USER = 'Unknown user';

/** Most servings the stepper offers. */
export const MAX_SERVINGS = 50;

/** A user id paired with that user's display name. */
type NameEntry = [userId: string, displayName: string];

/** One "share of your daily goal" figure, e.g. { label: 'protein', percent: 30 }. */
export interface GoalShare {
  label: string;
  percent: number;
}

/**
 * Full view of one recipe (`/recipes/:recipeId`, UC18): ingredients scaled to
 * the chosen servings (starting at the user's preferred servings, UC10), each
 * with how much of it the pantry holds (issue #38), dietary warnings, nutrition
 * against the user's daily goals, cost per serving against their budget, steps,
 * and star-rated reviews. From here the user can save it, tick ingredients
 * (or select / clear all) and add them to a grocery list, review it, or (as its
 * author) edit or delete it.
 */
@Component({
  selector: 'app-recipe-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    AddToGroceryPanel,
    ReviewForm,
    SaveButton,
    StarRating,
  ],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.css',
})
export class RecipePage {
  /** The recipe shown, or null while loading. */
  protected readonly recipe = signal<Recipe | null>(null);
  /** True if the recipe could not be loaded (missing, private, or a network error). */
  protected readonly loadError = signal(false);
  /** Servings the ingredients are scaled to; changed with the stepper. */
  protected readonly servings = signal(1);
  /** True while the author's "Delete this recipe?" confirmation is showing. */
  protected readonly confirmingDelete = signal(false);
  /** For the author: the users this recipe is shared with. */
  protected readonly shares = signal<SharedWithUser[]>([]);
  /** The last error from sharing or revoking, or null. */
  protected readonly shareError = signal<string | null>(null);
  /** The username field used to share the recipe. */
  protected readonly shareForm = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
  });
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
    // [label, amount per serving, daily target] for each nutrient.
    const shares: [string, number, number | null][] = [
      ['calories', nutrition.calories, targets.calories],
      ['protein', nutrition.protein, targets.protein],
      ['carbs', nutrition.carbohydrates, targets.carbohydrates],
      ['fat', nutrition.fat, targets.fat],
    ];
    // Skip goals the user has not set (or set to 0, which cannot be divided by).
    return shares
      .filter((share): share is [string, number, number] => share[2] !== null && share[2] > 0)
      .map(([label, amount, target]) => ({ label, percent: Math.round((amount / target) * 100) }));
  });
  protected readonly formatQuantity = formatQuantity;
  protected readonly formatMoney = formatMoney;

  /** The user's budget per serving while it is turned on, else null. */
  protected readonly budget = computed(() => activeBudget(this.preferences.preferences()));
  /** True if one serving costs more than the user's active budget. */
  protected readonly overBudget = computed(() => {
    const recipe = this.recipe();
    return recipe !== null && isOverBudget(recipe, this.budget());
  });

  /**
   * What the pantry holds of each ingredient at the recipe's own servings, in the same order, or
   * null until loaded (or if the pantry could not be loaded).
   */
  private readonly stockLevels = signal<StockLevel[] | null>(null);
  /** Each scaled ingredient with how much of it is on hand. */
  protected readonly stock = computed<IngredientStock[]>(() =>
    stockRows(this.scaledIngredients(), this.stockLevels()),
  );
  /** How many ingredients the pantry fully covers at the chosen servings. */
  protected readonly enoughCount = computed(
    () => this.stock().filter((row) => row.status === 'enough').length,
  );

  /**
   * Ingredients the user ticked or unticked themselves, or null to use the default (everything the
   * pantry doesn't fully cover, which follows the servings).
   */
  private readonly chosen = signal<ReadonlySet<string> | null>(null);
  /** The ingredients ticked to add to a grocery list. */
  protected readonly selected = computed<ReadonlySet<string>>(
    () => this.chosen() ?? defaultSelection(this.stock()),
  );
  /** The ticked ingredients with their costs, for the grocery panel. */
  protected readonly additions = computed<GroceryAddition[]>(() =>
    this.stock()
      .filter((row) => this.selected().has(row.name))
      .map((row) => ({
        name: row.name,
        cost: row.cost,
        missingCost: row.missingCost,
        covered: row.status === 'enough',
      })),
  );

  /** True if the signed-in user wrote this recipe (shows Edit and Delete). */
  protected readonly isAuthor = computed(() => this.recipe()?.authorId === this.session.userId());
  /** The signed-in user's own review of this recipe, if any. */
  protected readonly myReview = computed(
    () =>
      this.recipe()?.reviews.find((review) => review.reviewerId === this.session.userId()) ?? null,
  );
  /** The ingredients with amounts scaled from the recipe's servings to the chosen servings. */
  protected readonly scaledIngredients = computed<RecipeIngredient[]>(() => {
    const recipe = this.recipe();
    if (!recipe) {
      return [];
    }
    const factor = this.servings() / recipe.servings;
    return recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: scaleQuantity(ingredient.quantity, factor),
      estimatedCost: Math.round((ingredient.estimatedCost ?? 0) * factor * 100) / 100,
    }));
  });

  constructor(
    route: ActivatedRoute,
    private readonly recipes: RecipesService,
    private readonly users: UsersService,
    private readonly session: SessionService,
    private readonly toasts: ToastService,
    private readonly router: Router,
    private readonly pantry: PantryService,
    private readonly preferences: PreferencesService,
    private readonly recipeShares: RecipeSharesService,
  ) {
    // Reload whenever the recipe id in the address changes. `switchMap` cancels a load still in
    // flight when the user moves to another recipe.
    route.paramMap
      .pipe(
        map((params) => params.get('recipeId') ?? ''),
        switchMap((recipeId) => {
          this.recipe.set(null);
          this.loadError.set(false);
          this.stockLevels.set(null);
          this.chosen.set(null);
          this.shares.set([]);
          this.shareError.set(null);
          return this.recipes.getRecipe(recipeId).pipe(catchError(() => of(null)));
        }),
        // Fetch the author and reviewer names and the user's preferences together, before
        // showing the page.
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
          this.loadStock(loaded.recipe);
          if (loaded.recipe.authorId === this.session.userId()) {
            this.loadShares(loaded.recipe.id);
          }
        }
      });
  }

  /** The display name to show for `userId` ("You" for the signed-in user). */
  protected nameOf(userId: string): string {
    if (userId === this.session.userId()) {
      return 'You';
    }
    return this.names().get(userId) ?? UNKNOWN_USER;
  }

  /** Steps the servings up or down, keeping them between 1 and `MAX_SERVINGS`. */
  protected changeServings(delta: number): void {
    this.servings.update((current) => Math.min(MAX_SERVINGS, Math.max(1, current + delta)));
  }

  /** Shows the updated recipe (new rating and review list) after the user posts a review. */
  protected onReviewed(recipe: Recipe): void {
    this.recipe.set(recipe);
  }

  /** Deletes the recipe (author only) and returns to the feed. */
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

  /** Shares the recipe with the typed username; they see it at once and are notified. */
  protected shareRecipe(): void {
    const recipe = this.recipe();
    const username = this.shareForm.getRawValue().username.trim();
    if (!recipe) {
      return;
    }
    if (username.length === 0) {
      this.shareError.set('Enter the username to share with.');
      return;
    }
    this.recipeShares.share(recipe.id, username).subscribe({
      next: (shares) => {
        this.shares.set(shares);
        this.shareForm.reset();
        this.shareError.set(null);
        this.toasts.success(`Shared “${recipe.title}” with ${username}`);
      },
      error: (error: unknown) => this.shareError.set(errorMessage(error)),
    });
  }

  /** Stops sharing with one user; they can no longer see the recipe and are told. */
  protected revokeShare(person: SharedWithUser): void {
    const recipe = this.recipe();
    if (!recipe) {
      return;
    }
    this.recipeShares.revoke(recipe.id, person.id).subscribe({
      next: (shares) => {
        this.shares.set(shares);
        this.shareError.set(null);
        this.toasts.success(`Stopped sharing with ${person.displayName}`);
      },
      error: (error: unknown) => this.shareError.set(errorMessage(error)),
    });
  }

  /** Ticks or unticks one ingredient for the grocery list. */
  protected toggleSelected(ingredientName: string): void {
    const next = new Set(this.selected());
    // `delete` returns false when it was not ticked, so tick it instead.
    if (!next.delete(ingredientName)) {
      next.add(ingredientName);
    }
    this.chosen.set(next);
  }

  /** Ticks every ingredient. */
  protected selectAll(): void {
    this.chosen.set(new Set(this.stock().map((row) => row.name)));
  }

  /** Unticks every ingredient. */
  protected clearAll(): void {
    this.chosen.set(new Set());
  }

  /** True if the ingredient is ticked for the grocery list. */
  protected isSelected(ingredientName: string): boolean {
    return this.selected().has(ingredientName);
  }

  /**
   * Recipes only carry user ids, so look up the names to show. A failed
   * lookup is not an error for the page; that user just shows as unknown.
   */
  private lookUpNames(recipe: Recipe): Observable<ReadonlyMap<string, string>> {
    const reviewerIds = recipe.reviews.map((review) => review.reviewerId);
    // Each distinct user once; the signed-in user is shown as "You" and needs no lookup.
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

  /**
   * Asks the pantry how much it holds of each ingredient. Failing to load it is not an error;
   * every ingredient then shows as missing.
   */
  private loadStock(recipe: Recipe): void {
    const lines = recipe.ingredients.map(({ name, quantity }) => ({ name, quantity }));
    this.pantry
      .checkStock(lines)
      .pipe(catchError(() => of(null)))
      .subscribe((levels) => this.stockLevels.set(levels));
  }

  /** Loads who the author shared the recipe with. A failure just shows an empty list. */
  private loadShares(recipeId: string): void {
    this.recipeShares
      .getShares(recipeId)
      .pipe(catchError(() => of<SharedWithUser[]>([])))
      .subscribe((shares) => this.shares.set(shares));
  }
}
