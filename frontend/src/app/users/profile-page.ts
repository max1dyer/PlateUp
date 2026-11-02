import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { SessionService } from '../core/session.service';
import { GroceryList } from '../grocery-list/grocery-list.models';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { PantryItem } from '../pantry/pantry.models';
import { PantryService } from '../pantry/pantry.service';
import { formatQuantity } from '../grocery-list/grocery-list-format';
import { RecipeCard } from '../recipes/recipe-card';
import { Recipe } from '../recipes/recipe.models';
import { RecipesService } from '../recipes/recipes.service';
import { ProfileEditForm } from './profile-edit-form';
import { User } from './user.models';
import { UsersService } from './users.service';

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
  protected readonly data = signal<ProfileData | null>(null);
  protected readonly loadError = signal(false);
  protected readonly editing = signal(false);
  protected readonly formatQuantity = formatQuantity;
  protected readonly pantryPreview = PANTRY_PREVIEW;

  protected readonly isMe = computed(() => this.data()?.user.id === this.session.userId());
  /** Your own profile follows edits made through the session (and saves elsewhere). */
  protected readonly user = computed(() =>
    this.isMe() ? (this.session.currentUser() ?? this.data()?.user) : this.data()?.user,
  );
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
        recipes: data.recipes.filter((recipe) => recipe.authorId === data.user.id),
      })),
    );
  }

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
