import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { SessionService } from '../../core/session.service';
import { GroceryList } from '../../grocery-list/grocery-list.models';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { PantryItem } from '../../pantry/pantry.models';
import { PantryService } from '../../pantry/pantry.service';
import { formatQuantity } from '../../grocery-list/grocery-list-format';
import { RecipeCard } from '../../recipes/recipe-card/recipe-card';
import { Recipe } from '../../recipes/recipe.models';
import { RecipesService } from '../../recipes/recipes.service';
import { ProfileEditForm } from '../profile-edit-form/profile-edit-form';
import { User } from '../user.models';
import { UsersService } from '../users.service';

/** Everything the profile page shows; the private parts are only loaded for your own profile. */
interface ProfileData {
  user: User;
  recipes: Recipe[];
  saved: Recipe[];
  groceryLists: GroceryList[];
  pantry: PantryItem[];
}

/** How many pantry items the profile previews. */
const PANTRY_PREVIEW = 6;

/**
 * Profile page (UC25). `/profile` is the signed-in user's own profile: it can
 * be edited and also lists their saved recipes, grocery lists, and pantry.
 * `/users/:userId` shows someone else's public profile and public recipes.
 */
@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, RecipeCard, ProfileEditForm],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  /** Everything loaded for the profile, or null while loading. */
  protected readonly data = signal<ProfileData | null>(null);
  /** True if the profile could not be loaded. */
  protected readonly loadError = signal(false);
  /** True while the edit form is open (own profile only). */
  protected readonly editing = signal(false);
  protected readonly formatQuantity = formatQuantity;
  protected readonly pantryPreview = PANTRY_PREVIEW;

  /** True when viewing your own profile. */
  protected readonly isMe = computed(() => this.data()?.user.id === this.session.userId());
  /** Your own profile follows edits made through the session (and saves elsewhere). */
  protected readonly user = computed(() =>
    this.isMe() ? (this.session.currentUser() ?? this.data()?.user) : this.data()?.user,
  );
  /** Your saved recipes, dropping any you unsave while on the page. */
  protected readonly saved = computed(() => {
    const savedIds = this.session.currentUser()?.savedRecipeIds ?? [];
    return (this.data()?.saved ?? []).filter((recipe) => savedIds.includes(recipe.id));
  });

  constructor(
    route: ActivatedRoute,
    private readonly session: SessionService,
    private readonly users: UsersService,
    private readonly recipes: RecipesService,
    private readonly groceryLists: GroceryListsService,
    private readonly pantry: PantryService,
  ) {
    // Reload whenever the address changes between `/profile` and `/users/:userId`.
    route.paramMap
      .pipe(
        map((params) => params.get('userId')),
        switchMap((userId) => {
          this.data.set(null);
          this.loadError.set(false);
          this.editing.set(false);
          const isMe = userId === null || userId === this.session.userId();
          return (isMe ? this.loadMine() : this.loadPublic(userId)).pipe(
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.data.set(data);
        this.loadError.set(data === null);
      });
  }

  /** Loads your own profile and its private sections in parallel. */
  private loadMine(): Observable<ProfileData> {
    return forkJoin({
      user: this.users.getMe(),
      recipes: this.recipes.getRecipes(),
      saved: this.users.getSavedRecipes(),
      groceryLists: this.groceryLists.getLists(),
      pantry: this.pantry.getItems(),
    }).pipe(
      map((data) => ({
        ...data,
        // Only the recipes you wrote.
        recipes: data.recipes.filter((recipe) => recipe.authorId === data.user.id),
      })),
    );
  }

  /** Loads someone else's public profile and the recipes of theirs you can see. */
  private loadPublic(userId: string): Observable<ProfileData> {
    return forkJoin({ user: this.users.getUser(userId), recipes: this.recipes.getRecipes() }).pipe(
      map(({ user, recipes }) => ({
        user,
        recipes: recipes.filter((recipe) => recipe.authorId === userId),
        saved: [],
        groceryLists: [],
        pantry: [],
      })),
    );
  }
}
