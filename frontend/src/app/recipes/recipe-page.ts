import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { DEMO_USER_ID } from '../core/user-id.interceptor';
import { formatQuantity } from '../grocery-list/grocery-list-format';
import { UsersService } from '../users/users.service';
import { Recipe } from './recipe.models';
import { RecipesService } from './recipes.service';

/** Shown for users whose profile cannot be loaded (deleted, or the demo user). */
export const UNKNOWN_USER = 'Unknown user';

type NameEntry = [userId: string, displayName: string];

/** Full view of one recipe (`/recipes/:recipeId`): ingredients, steps, and reviews. */
@Component({
  selector: 'app-recipe-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.css',
})
export class RecipePage {
  protected readonly recipe = signal<Recipe | null>(null);
  protected readonly loadError = signal(false);
  /** Display names of the author and reviewers, by user id. */
  private readonly names = signal<ReadonlyMap<string, string>>(new Map());

  protected readonly formatQuantity = formatQuantity;

  constructor(
    route: ActivatedRoute,
    private readonly recipes: RecipesService,
    private readonly users: UsersService,
  ) {
    route.paramMap
      .pipe(
        map((params) => params.get('recipeId') ?? ''),
        switchMap((recipeId) => {
          this.recipe.set(null);
          this.loadError.set(false);
          return this.recipes.getRecipe(recipeId).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((recipe) => {
        this.recipe.set(recipe);
        this.loadError.set(recipe === null);
        if (recipe) {
          this.loadNames(recipe);
        }
      });
  }

  protected nameOf(userId: string): string {
    if (userId === DEMO_USER_ID) {
      return 'You';
    }
    return this.names().get(userId) ?? UNKNOWN_USER;
  }

  /** Recipes only carry user ids, so look up the names to show. */
  private loadNames(recipe: Recipe): void {
    const reviewerIds = recipe.reviews.map((review) => review.reviewerId);
    const userIds = [...new Set([recipe.authorId, ...reviewerIds])];
    const lookups = userIds.filter((userId) => userId !== DEMO_USER_ID);
    if (lookups.length === 0) {
      return;
    }
    forkJoin(lookups.map((userId) => this.lookUpName(userId))).subscribe((entries) => {
      this.names.set(new Map(entries.filter((entry): entry is NameEntry => entry !== null)));
    });
  }

  /** A failed lookup is not an error for the page; that user just shows as unknown. */
  private lookUpName(userId: string): Observable<NameEntry | null> {
    return this.users.getUser(userId).pipe(
      map((user): NameEntry => [userId, user.displayName]),
      catchError(() => of(null)),
    );
  }
}
