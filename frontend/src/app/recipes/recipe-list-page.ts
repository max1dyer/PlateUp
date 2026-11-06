import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeCard } from './recipe-card';
import { RecipeSort, SORT_OPTIONS, filterRecipes, sortRecipes, tagsOf } from './recipe-filter';
import { Recipe } from './recipe.models';
import { RecipesService } from './recipes.service';

/**
 * "Recipes" feed (UC2): every recipe the user can see, with a search box, a
 * "Filters" dropdown for tags, and a "Sort by" menu (newest first by default). Each card links to the full recipe and can be
 * saved in one tap.
 */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RouterLink, RecipeCard],
  templateUrl: './recipe-list-page.html',
  styleUrl: './recipe-list-page.css',
})
export class RecipeListPage implements OnInit {
  protected readonly recipes = signal<Recipe[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly search = signal('');
  protected readonly tag = signal<string | null>(null);
  protected readonly sort = signal<RecipeSort>('newest');
  protected readonly sortOptions = SORT_OPTIONS;

  protected readonly tags = computed(() => tagsOf(this.recipes()));
  protected readonly shown = computed(() =>
    sortRecipes(filterRecipes(this.recipes(), this.search(), this.tag()), this.sort()),
  );

  constructor(private readonly recipesService: RecipesService) {}

  public ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
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

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as RecipeSort);
  }

  protected toggleTag(tag: string): void {
    this.tag.update((current) => (current === tag ? null : tag));
  }

  protected clearFilters(): void {
    this.search.set('');
    this.tag.set(null);
  }
}
