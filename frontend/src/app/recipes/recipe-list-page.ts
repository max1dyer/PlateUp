import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from './recipe.models';
import { RecipesService } from './recipes.service';

/**
 * "Recipes" page: every recipe the user can see, each linking to its full
 * page. Placeholder for the recipe feed with sorting and filtering.
 */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RouterLink],
  templateUrl: './recipe-list-page.html',
  styleUrl: './recipe-list-page.css',
})
export class RecipeListPage implements OnInit {
  protected readonly recipes = signal<Recipe[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  constructor(private readonly recipesService: RecipesService) {}

  public ngOnInit(): void {
    this.recipesService.getRecipes().subscribe({
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
