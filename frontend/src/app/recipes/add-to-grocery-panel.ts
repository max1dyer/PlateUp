import { Component, OnInit, computed, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, map, of, startWith, switchMap } from 'rxjs';

import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { GroceryList } from '../grocery-list/grocery-list.models';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { Recipe } from './recipe.models';

/** Value of the list picker that means "make a new list". */
export const NEW_LIST = 'new';

/** Name offered for a new list. */
export const DEFAULT_LIST_NAME = 'Groceries';

/**
 * The recipe page's grocery control: the target list is picked up front, and
 * one button adds the ingredients not marked as owned (scaled to `servings`)
 * to it, leaving the user on the recipe (UC6).
 */
@Component({
  selector: 'app-add-to-grocery-panel',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-to-grocery-panel.html',
  styleUrl: './add-to-grocery-panel.css',
})
export class AddToGroceryPanel implements OnInit {
  public readonly recipe = input.required<Recipe>();
  public readonly servings = input.required<number>();
  /** Ingredient names the user has (or marked as having), which are left off the list. */
  public readonly owned = input<ReadonlySet<string>>(new Set());

  protected readonly newList = NEW_LIST;
  protected readonly lists = signal<GroceryList[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    listId: new FormControl(NEW_LIST, { nonNullable: true }),
    newListName: new FormControl(DEFAULT_LIST_NAME, { nonNullable: true }),
  });

  /** The picked list id as a signal, so the template updates without zone.js. */
  protected readonly listId = toSignal(
    this.form.controls.listId.valueChanges.pipe(startWith(this.form.controls.listId.value)),
    { requireSync: true },
  );

  /** Recipe ingredients marked as owned, which are left off the list. */
  private readonly ownedNames = computed(() =>
    this.recipe()
      .ingredients.map((ingredient) => ingredient.name)
      .filter((name) => this.owned().has(name)),
  );

  protected readonly missingCount = computed(
    () => this.recipe().ingredients.length - this.ownedNames().length,
  );

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
  ) {}

  public ngOnInit(): void {
    this.groceryLists.getLists().subscribe({
      next: (lists) => {
        this.lists.set(lists);
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

  /**
   * Adds every ingredient not marked as owned through the backend's recipe
   * endpoint, which scales, categorizes, and merges them into the list.
   */
  protected addMissing(): void {
    const excluded = this.ownedNames();
    const { listId, newListName } = this.form.getRawValue();
    const name = newListName.trim();
    if (listId === NEW_LIST && name.length === 0) {
      this.error.set('Name the new list.');
      return;
    }

    const count = this.recipe().ingredients.length - excluded.length;
    const target: Observable<string> =
      listId === NEW_LIST
        ? this.groceryLists.createList(name).pipe(map((list) => list.id))
        : of(listId);

    this.saving.set(true);
    this.error.set(null);
    target
      .pipe(
        switchMap((id) =>
          this.groceryLists.addRecipe(id, this.recipe().id, this.servings(), excluded),
        ),
      )
      .subscribe({
        next: (list) => {
          this.saving.set(false);
          this.remember(list);
          this.toasts.success(
            `Added ${count} ${count === 1 ? 'ingredient' : 'ingredients'} to ${list.name}`,
          );
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(errorMessage(error));
        },
      });
  }

  /** Keeps the picker current: a new list joins it and stays selected for the next add. */
  private remember(list: GroceryList): void {
    this.lists.update((lists) =>
      lists.some((existing) => existing.id === list.id)
        ? lists.map((existing) => (existing.id === list.id ? list : existing))
        : [...lists, list],
    );
    this.form.setValue({ listId: list.id, newListName: DEFAULT_LIST_NAME });
  }
}
