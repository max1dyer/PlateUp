import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, concatMap, forkJoin, from, last, map, of, switchMap } from 'rxjs';

import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import {
  formatQuantity,
  isSameIngredient,
  scaleQuantity,
} from '../grocery-list/grocery-list-format';
import { GroceryList, Quantity } from '../grocery-list/grocery-list.models';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { PantryItem } from '../pantry/pantry.models';
import { PantryService } from '../pantry/pantry.service';
import { Recipe, RecipeIngredient } from './recipe.models';

/** Value of the list picker that means "make a new list". */
export const NEW_LIST = 'new';

/** A recipe ingredient the user already has in their pantry. */
export interface PantryMatch {
  name: string;
  needed: Quantity;
  have: Quantity;
}

@Component({
  selector: 'app-add-to-grocery-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './add-to-grocery-panel.html',
  styleUrl: './add-to-grocery-panel.css',
})
export class AddToGroceryPanel implements OnInit {
  public readonly recipe = input.required<Recipe>();
  public readonly servings = input.required<number>();
  public readonly closed = output<void>();
  public readonly ingredients = input.required<RecipeIngredient[]>();
  public readonly addWholeRecipe = input(false);

  protected readonly newList = NEW_LIST;
  protected readonly formatQuantity = formatQuantity;

  protected readonly lists = signal<GroceryList[]>([]);
  protected readonly pantryItems = signal<PantryItem[]>([]);
  protected readonly addAnyway = signal<ReadonlySet<string>>(new Set());

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly pantryMatches = computed<PantryMatch[]>(() => {
    const recipe = this.recipe();
    const factor = this.servings() / recipe.servings;

    return recipe.ingredients.flatMap((ingredient) => {
      const owned = this.pantryItems().find((item) => isSameIngredient(item.name, ingredient.name));

      return owned
        ? [
            {
              name: ingredient.name,
              needed: scaleQuantity(ingredient.quantity, factor),
              have: owned.quantity,
            },
          ]
        : [];
    });
  });

  /** Ingredients that should be omitted because they are already in the pantry. */
  protected readonly skipped = computed(() =>
    this.pantryMatches()
      .map((match) => match.name)
      .filter((name) => !this.addAnyway().has(name)),
  );

  protected readonly addCount = computed(() => {
    return this.recipe().ingredients.length - this.skipped().length;
  });

  protected readonly form = new FormGroup({
    listId: new FormControl(NEW_LIST, { nonNullable: true }),
    newListName: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly pantry: PantryService,
    private readonly toasts: ToastService,
    private readonly router: Router,
  ) {}

  public ngOnInit(): void {
    this.form.controls.newListName.setValue(this.recipe().title);

    forkJoin({
      lists: this.groceryLists.getLists(),
      // If the pantry lookup fails, continue by adding all ingredients.
      pantry: this.pantry.getItems().pipe(catchError(() => of<PantryItem[]>([]))),
    }).subscribe({
      next: ({ lists, pantry }) => {
        this.lists.set(lists);
        this.pantryItems.set(pantry);

        if (lists.length > 0) {
          this.form.controls.listId.setValue(lists[0].id);
        }

        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  protected isAddingAnyway(name: string): boolean {
    return this.addAnyway().has(name);
  }

  protected toggleAddAnyway(name: string): void {
    this.addAnyway.update((names) => {
      const next = new Set(names);

      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });

    this.error.set(null);
  }

  protected add(): void {
    const { listId, newListName } = this.form.getRawValue();

    if (this.addCount() === 0) {
      this.error.set('Everything is already in your pantry. Tick an item to add it anyway.');
      return;
    }

    if (listId === NEW_LIST && newListName.trim().length === 0) {
      this.error.set('Name the new list.');
      return;
    }

    const targetId: Observable<string> =
      listId === NEW_LIST
        ? this.groceryLists.createList(newListName).pipe(map((list) => list.id))
        : of(listId);

    const skipped = this.skipped();

    // For the partial-ingredient flow, exclude pantry matches unless
    // the user checked "add anyway".
    const ingredientsToAdd = this.ingredients().filter(
      (ingredient) => !skipped.some((name) => isSameIngredient(name, ingredient.name)),
    );

    if (!this.addWholeRecipe() && ingredientsToAdd.length === 0) {
      this.error.set('Everything is already in your pantry. Tick an item to add it anyway.');
      return;
    }

    const count = this.addWholeRecipe() ? this.addCount() : ingredientsToAdd.length;

    this.saving.set(true);
    this.error.set(null);

    targetId
      .pipe(
        switchMap((id) => {
          if (this.addWholeRecipe()) {
            return this.groceryLists.addRecipe(id, this.recipe().id, this.servings(), skipped);
          }

          return from(ingredientsToAdd).pipe(
            concatMap((ingredient) =>
              this.groceryLists.addItem(id, {
                name: ingredient.name,
                quantity: ingredient.quantity,
              }),
            ),
            last(),
          );
        }),
      )
      .subscribe({
        next: (list) => {
          this.saving.set(false);

          const pantryNote = skipped.length > 0 ? ` (${skipped.length} already in pantry)` : '';

          this.toasts.success(`Added ${count} ingredients to ${list.name}${pantryNote}`);

          void this.router.navigate(['/grocery'], {
            queryParams: { list: list.id },
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(errorMessage(error));
        },
      });
  }
}
