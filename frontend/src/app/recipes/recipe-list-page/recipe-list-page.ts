import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DIETARY_DISCLAIMER,
  activeBudget,
  formatMoney,
  restrictionLabel,
} from '../../preferences/preferences.models';
import { PreferencesService } from '../../preferences/preferences.service';
import { RecipeCard } from '../recipe-card/recipe-card';
import {
  DEFAULT_SORT,
  NO_RANGES,
  RANGE_FIELDS,
  RangeField,
  RecipeRanges,
  RecipeSort,
  SORT_OPTIONS,
  activeRangeCount,
  dietWarnings,
  filterByBudget,
  filterByDiet,
  filterByRanges,
  filterRecipes,
  isOverBudget,
  sortRecipes,
  tagsOf,
} from '../recipe-filter';
import { Recipe } from '../recipe.models';
import { RecipesService } from '../recipes.service';

/**
 * "Recipes" feed (UC2): every recipe the user can see, with a search box, a
 * "Filters" dropdown (diet, budget, tags, and calorie / macro / step ranges), and a
 * "Sort by" menu that can be reversed (trending first by default).
 * Recipes that break the user's dietary restrictions (UC10) or cost more per
 * serving than their budget (when it is turned on) are hidden by default; when
 * shown, their cards carry a warning. Each card links to the full recipe and
 * can be saved in one tap.
 */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RouterLink, RecipeCard],
  templateUrl: './recipe-list-page.html',
  styleUrl: './recipe-list-page.css',
})
export class RecipeListPage implements OnInit {
  /** Every recipe the user can see, as loaded. */
  protected readonly recipes = signal<Recipe[]>([]);
  /** True until the recipes have loaded. */
  protected readonly loading = signal(true);
  /** True if the recipes could not be loaded (the page offers a retry). */
  protected readonly loadError = signal(false);
  /** Text typed in the search box. */
  protected readonly search = signal('');
  /** The tag chosen in the Filters dropdown, or null for all. */
  protected readonly tag = signal<string | null>(null);
  /** The chosen sort order. */
  protected readonly sort = signal<RecipeSort>(DEFAULT_SORT);
  /** True to show the chosen sort back to front (e.g. most expensive first). */
  protected readonly reversed = signal(false);
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly rangeFields = RANGE_FIELDS;
  /** Minimum and maximum calories, macros, and steps typed in the Filters panel. */
  protected readonly ranges = signal<RecipeRanges>(NO_RANGES);
  /** How many filters are set, for the badge on the Filters button. */
  protected readonly activeFilters = computed(
    () => (this.tag() === null ? 0 : 1) + activeRangeCount(this.ranges()),
  );
  protected readonly disclaimer = DIETARY_DISCLAIMER;
  /** Whether recipes that break the user's dietary restrictions are hidden. */
  protected readonly hideUnsuitable = signal(true);
  /** Whether recipes over the user's budget per serving are hidden (only while it is on). */
  protected readonly hideOverBudget = signal(true);
  protected readonly formatMoney = formatMoney;

  /** The user's budget per serving while it is turned on, else null. */
  protected readonly budget = computed(() => activeBudget(this.preferencesService.preferences()));

  /** The user's dietary restrictions, or none until preferences load. */
  protected readonly restrictions = computed(
    () => this.preferencesService.preferences()?.dietaryRestrictions ?? [],
  );
  /** The restrictions as readable text, e.g. "Vegan, Nut-free". */
  protected readonly restrictionLabels = computed(() =>
    this.restrictions().map(restrictionLabel).join(', '),
  );
  /** Recipes that break none of the user's restrictions. */
  private readonly suitable = computed(() => filterByDiet(this.recipes(), this.restrictions()));
  /** How many recipes the dietary filter is hiding right now. */
  protected readonly hiddenByDiet = computed(() =>
    this.hideUnsuitable() ? this.recipes().length - this.suitable().length : 0,
  );
  /** The diet filter's result, then the budget filter (each only when on). */
  private readonly pool = computed(() => {
    const afterDiet = this.hideUnsuitable() ? this.suitable() : this.recipes();
    return this.hideOverBudget() ? filterByBudget(afterDiet, this.budget()) : afterDiet;
  });
  /** How many recipes (that the diet filter lets through) the budget filter is hiding. */
  protected readonly hiddenByBudget = computed(() => {
    const afterDiet = this.hideUnsuitable() ? this.suitable() : this.recipes();
    return afterDiet.length - this.pool().length;
  });

  /** Every tag in the feed, for the Filters dropdown. */
  protected readonly tags = computed(() => tagsOf(this.recipes()));
  /** The cards to show: diet and budget filters (when on), search, tag, ranges, then the sort. */
  protected readonly shown = computed(() => {
    const matching = filterRecipes(this.pool(), this.search(), this.tag());
    return sortRecipes(filterByRanges(matching, this.ranges()), this.sort(), this.reversed());
  });

  constructor(
    private readonly recipesService: RecipesService,
    private readonly preferencesService: PreferencesService,
  ) {}

  /** Loads the user's preferences (for the diet filter) and the recipes. */
  public ngOnInit(): void {
    this.preferencesService.load().subscribe();
    this.load();
  }

  /** Warnings for a card; only non-empty when unsuitable or over-budget recipes are shown. */
  protected warningsFor(recipe: Recipe): string[] {
    const warnings = dietWarnings(recipe, this.restrictions());
    const budget = this.budget();
    if (budget !== null && isOverBudget(recipe, budget)) {
      warnings.push(`Over your ${formatMoney(budget)}/serving budget`);
    }
    return warnings;
  }

  /** Fetches every recipe the user can see. */
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

  /** Updates the search text as the user types. */
  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Applies the sort picked in the "Sort by" menu. */
  protected onSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as RecipeSort);
  }

  /** Flips the sort order. */
  protected toggleReversed(): void {
    this.reversed.update((reversed) => !reversed);
  }

  /**
   * Sets one end of a range as the user types; a blank or invalid box leaves that end open.
   */
  protected onRange(field: RangeField, end: 'min' | 'max', event: Event): void {
    const text = (event.target as HTMLInputElement).value.trim();
    const value = text === '' ? null : Number(text);
    this.ranges.update((ranges) => ({
      ...ranges,
      [field]: { ...ranges[field], [end]: value !== null && Number.isFinite(value) ? value : null },
    }));
  }

  /** Turns the budget filter on or off. */
  protected onHideOverBudget(event: Event): void {
    this.hideOverBudget.set((event.target as HTMLInputElement).checked);
  }

  /** Filters by `tag`, or clears the tag filter if it was already chosen. */
  protected toggleTag(tag: string): void {
    this.tag.update((current) => (current === tag ? null : tag));
  }

  /** Turns the dietary filter on or off. */
  protected onHideUnsuitable(event: Event): void {
    this.hideUnsuitable.set((event.target as HTMLInputElement).checked);
  }

  /** Turns off the diet and budget filters. */
  protected showAll(): void {
    this.hideUnsuitable.set(false);
    this.hideOverBudget.set(false);
  }

  /** Clears the search, tag, and ranges (the sort, diet, and budget filters are kept). */
  protected clearFilters(): void {
    this.search.set('');
    this.tag.set(null);
    this.ranges.set(NO_RANGES);
  }
}
