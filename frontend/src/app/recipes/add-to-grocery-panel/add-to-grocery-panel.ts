import { Component, OnInit, computed, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, map, of, startWith, switchMap } from 'rxjs';

import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { GroceryList } from '../../grocery-list/grocery-list.models';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { activeBudget, formatMoney } from '../../preferences/preferences.models';
import { PreferencesService } from '../../preferences/preferences.service';
import { Recipe } from '../recipe.models';

/** Value of the list picker that means "make a new list". */
export const NEW_LIST = 'new';

/** Name offered for a new list. */
export const DEFAULT_LIST_NAME = 'Groceries';

/** One ingredient the user ticked on the recipe page, with what adding it would cost. */
export interface GroceryAddition {
  name: string;
  /** Estimated cost of the full amount at the chosen servings (US dollars). */
  cost: number;
  /** Estimated cost of only what the pantry is missing. */
  missingCost: number;
  /** True if the pantry already holds the full amount. */
  covered: boolean;
}

/**
 * The recipe page's grocery control: the target list is picked up front, and
 * one button adds the ticked ingredients (scaled to `servings`) to it, leaving
 * the user on the recipe (UC6). With "Only add what my pantry is missing" on,
 * a half-stocked ingredient is added only for the rest. The estimated cost is
 * shown against the user's budget for that many servings, when it is on.
 */
@Component({
  selector: 'app-add-to-grocery-panel',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-to-grocery-panel.html',
  styleUrl: './add-to-grocery-panel.css',
})
export class AddToGroceryPanel implements OnInit {
  /** The recipe whose ingredients are added. */
  public readonly recipe = input.required<Recipe>();
  /** Servings to scale the ingredients to (the recipe page's current choice). */
  public readonly servings = input.required<number>();
  /** The ingredients the user ticked to add; every other ingredient is left off the list. */
  public readonly additions = input<readonly GroceryAddition[]>([]);

  protected readonly newList = NEW_LIST;
  /** The user's lists, offered in the picker. */
  protected readonly lists = signal<GroceryList[]>([]);
  /** True until the user's lists have loaded. */
  protected readonly loading = signal(true);
  /** True while the ingredients are being added. */
  protected readonly saving = signal(false);
  /** The last error to show, or null. */
  protected readonly error = signal<string | null>(null);

  /** The target list (or `NEW_LIST`) and the name to give a new list. */
  protected readonly form = new FormGroup({
    listId: new FormControl(NEW_LIST, { nonNullable: true }),
    newListName: new FormControl(DEFAULT_LIST_NAME, { nonNullable: true }),
    onlyMissing: new FormControl(true, { nonNullable: true }),
  });
  protected readonly formatMoney = formatMoney;

  /** The picked list id as a signal, so the template updates without zone.js. */
  protected readonly listId = toSignal(
    this.form.controls.listId.valueChanges.pipe(startWith(this.form.controls.listId.value)),
    { requireSync: true },
  );

  /** The "only what's missing" checkbox as a signal. */
  protected readonly onlyMissing = toSignal(
    this.form.controls.onlyMissing.valueChanges.pipe(
      startWith(this.form.controls.onlyMissing.value),
    ),
    { requireSync: true },
  );

  /** Recipe ingredients that were not ticked, which are left off the list. */
  private readonly excludedNames = computed(() => {
    const ticked = new Set(this.additions().map((addition) => addition.name));
    return this.recipe()
      .ingredients.map((ingredient) => ingredient.name)
      .filter((name) => !ticked.has(name));
  });

  /** The ticked ingredients that will actually be added (fully stocked ones are skipped). */
  private readonly toAdd = computed(() =>
    this.onlyMissing()
      ? this.additions().filter((addition) => !addition.covered)
      : this.additions(),
  );

  /** How many ingredients the button will add. */
  protected readonly missingCount = computed(() => this.toAdd().length);

  /** Estimated cost of what the button will add. */
  protected readonly estimatedCost = computed(() => {
    const total = this.toAdd().reduce(
      (sum, addition) => sum + (this.onlyMissing() ? addition.missingCost : addition.cost),
      0,
    );
    return Math.round(total * 100) / 100;
  });

  /** The user's budget for this many servings while it is on (per serving × servings), or null. */
  protected readonly budgetTotal = computed(() => {
    const perServing = activeBudget(this.preferences.preferences());
    return perServing === null ? null : Math.round(perServing * this.servings() * 100) / 100;
  });

  /** True if the estimate is over the budget for this many servings. */
  protected readonly overBudget = computed(() => {
    const limit = this.budgetTotal();
    return limit !== null && this.estimatedCost() > limit;
  });

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
    private readonly preferences: PreferencesService,
  ) {}

  /** Loads the user's lists and pre-selects the first one ("new list" if they have none). */
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
   * Adds the ticked ingredients through the backend's recipe endpoint, which
   * scales, categorizes, and merges them into the list (and, with "only what's
   * missing", subtracts what the pantry holds).
   */
  protected addMissing(): void {
    const excluded = this.excludedNames();
    const { listId, newListName, onlyMissing } = this.form.getRawValue();
    const name = newListName.trim();
    if (listId === NEW_LIST && name.length === 0) {
      this.error.set('Name the new list.');
      return;
    }

    const count = this.missingCount();
    // Resolve the target list id first, creating the list when "new list" is picked.
    const target: Observable<string> =
      listId === NEW_LIST
        ? this.groceryLists.createList(name).pipe(map((list) => list.id))
        : of(listId);

    this.saving.set(true);
    this.error.set(null);
    target
      .pipe(
        switchMap((id) =>
          this.groceryLists.addRecipe(id, this.recipe().id, this.servings(), excluded, onlyMissing),
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
    this.form.patchValue({ listId: list.id, newListName: DEFAULT_LIST_NAME });
  }
}
