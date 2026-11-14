import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SessionService } from '../../core/session.service';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { PantryService } from '../../pantry/pantry.service';
import { RecipeCard } from '../../recipes/recipe-card/recipe-card';
import { Recipe } from '../../recipes/recipe.models';
import { RecipesService } from '../../recipes/recipes.service';

/** A tile linking to one of the app's main features. */
interface Shortcut {
  label: string;
  hint: string;
  path: string;
  icon: string;
}

/** How many of the newest recipes the home page shows. */
const NEWEST_COUNT = 3;

/** Landing page after signing in: shortcuts to each feature and the newest recipes. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, RecipeCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  /** The newest recipes, newest first. */
  protected readonly newest = signal<Recipe[]>([]);
  /** Pantry and grocery totals for the shortcut tiles; null until both have loaded. */
  protected readonly counts = signal<{ pantry: number; groceryItems: number } | null>(null);

  /** The feature tiles, in display order. */
  protected readonly shortcuts: readonly Shortcut[] = [
    { label: 'Browse recipes', hint: 'Find your next meal', path: '/recipes', icon: '🍲' },
    { label: 'Upload a recipe', hint: 'Share what you cook', path: '/recipes/new', icon: '📝' },
    { label: 'Pantry', hint: 'What you have at home', path: '/pantry', icon: '🥫' },
    { label: 'Grocery list', hint: 'What to buy next', path: '/grocery', icon: '🛒' },
  ];

  constructor(
    protected readonly session: SessionService,
    private readonly recipes: RecipesService,
    private readonly pantry: PantryService,
    private readonly groceryLists: GroceryListsService,
  ) {}

  /** Loads the newest recipes and the pantry and grocery counts in parallel. */
  public ngOnInit(): void {
    this.recipes
      .getRecipes()
      .subscribe((recipes) =>
        this.newest.set(
          [...recipes]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, NEWEST_COUNT),
        ),
      );
    // Wait for both requests so the two counts appear together. The grocery count is items still to
    // buy, across every list.
    forkJoin({ pantry: this.pantry.getItems(), lists: this.groceryLists.getLists() }).subscribe(
      ({ pantry, lists }) =>
        this.counts.set({
          pantry: pantry.length,
          groceryItems: lists.reduce(
            (total, list) => total + list.items.filter((item) => !item.purchased).length,
            0,
          ),
        }),
    );
  }
}
