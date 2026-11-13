import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIETARY_DISCLAIMER, restrictionLabel } from '../preferences/preferences.models';
import { PreferencesService } from '../preferences/preferences.service';
import { RecipeCard } from './recipe-card';
import {
  RecipeSort,
  SORT_OPTIONS,
  dietWarnings,
  filterByDiet,
  filterRecipes,
  sortRecipes,
  tagsOf,
} from './recipe-filter';
import { Recipe } from './recipe.models';
import { RecipesService } from './recipes.service';

/**
 * "Recipes" feed (UC2): every recipe the user can see, with a search box, a
 * "Filters" dropdown for tags, and a "Sort by" menu (newest first by default).
 * Recipes that break the user's dietary restrictions (UC10) are hidden by
 * default; when shown, their cards carry a warning. Each card links to the
 * full recipe and can be saved in one tap.
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
  protected readonly disclaimer = DIETARY_DISCLAIMER;
  /** Whether recipes that break the user's dietary restrictions are hidden. */
  protected readonly hideUnsuitable = signal(true);

  /** The user's dietary restrictions, or none until preferences load. */
  protected readonly restrictions = computed(
    () => this.preferencesService.preferences()?.dietaryRestrictions ?? [],
  );
  protected readonly restrictionLabels = computed(() =>
    this.restrictions().map(restrictionLabel).join(', '),
  );
  private readonly suitable = computed(() => filterByDiet(this.recipes(), this.restrictions()));
  /** How many recipes the dietary filter is hiding right now. */
  protected readonly hiddenByDiet = computed(() =>
    this.hideUnsuitable() ? this.recipes().length - this.suitable().length : 0,
  );

  protected readonly tags = computed(() => tagsOf(this.recipes()));
  protected readonly shown = computed(() => {
    const pool = this.hideUnsuitable() ? this.suitable() : this.recipes();
    return sortRecipes(filterRecipes(pool, this.search(), this.tag()), this.sort());
  });

  constructor(
    private readonly recipesService: RecipesService,
    private readonly preferencesService: PreferencesService,
  ) {}

  public ngOnInit(): void {
    this.preferencesService.load().subscribe();
    this.load();
  }

  /** Warnings for a card; only non-empty when unsuitable recipes are being shown. */
  protected warningsFor(recipe: Recipe): string[] {
    return dietWarnings(recipe, this.restrictions());
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

  protected onHideUnsuitable(event: Event): void {
    this.hideUnsuitable.set((event.target as HTMLInputElement).checked);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.tag.set(null);
  }
}
