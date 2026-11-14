import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/session.service';
import { UsersService } from '../../users/users.service';
import { RecipeCard } from '../recipe-card/recipe-card';
import { Recipe } from '../recipe.models';

/** "Saved" page (UC23): the recipes the signed-in user saved. */
@Component({
  selector: 'app-saved-recipes-page',
  imports: [RouterLink, RecipeCard],
  templateUrl: './saved-recipes-page.html',
})
export class SavedRecipesPage implements OnInit {
  /** The saved recipes as loaded when the page opened. */
  private readonly recipes = signal<Recipe[]>([]);
  /** True until the saved recipes have loaded. */
  protected readonly loading = signal(true);
  /** True if the saved recipes could not be loaded (the page offers a retry). */
  protected readonly loadError = signal(false);

  /** Unsaving on this page removes the card straight away. */
  protected readonly saved = computed(() => {
    const savedIds = this.session.currentUser()?.savedRecipeIds ?? [];
    return this.recipes().filter((recipe) => savedIds.includes(recipe.id));
  });

  constructor(
    private readonly users: UsersService,
    private readonly session: SessionService,
  ) {}

  /** Loads the saved recipes when the page opens. */
  public ngOnInit(): void {
    this.load();
  }

  /** Fetches the user's saved recipes. */
  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.users.getSavedRecipes().subscribe({
      next: (recipes) => {
        this.recipes.set(recipes);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}
