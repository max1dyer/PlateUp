import { Component, OnInit, computed, signal } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { AddItemsForm } from './add-items-form';
import { GroceryItemRow } from './grocery-item-row';
import { errorMessage, groupByCategory } from './grocery-list-format';
import { GroceryList } from './grocery-list.models';
import { GroceryListsService } from './grocery-lists.service';

/** Name given to the list created for a user who has none yet. */
export const DEFAULT_LIST_NAME = 'Grocery list';

/**
 * "Your Grocery List" page. Shows the user's first list (creating one if they
 * have none) grouped by category; a picker for other lists comes later.
 */
@Component({
  selector: 'app-grocery-list-page',
  imports: [AddItemsForm, GroceryItemRow],
  templateUrl: './grocery-list-page.html',
  styleUrl: './grocery-list-page.css',
})
export class GroceryListPage implements OnInit {
  protected readonly list = signal<GroceryList | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly adding = signal(false);

  protected readonly groups = computed(() => groupByCategory(this.list()?.items ?? []));
  protected readonly itemCount = computed(() => this.list()?.items.length ?? 0);
  protected readonly inCartCount = computed(
    () => this.list()?.items.filter((item) => item.purchased).length ?? 0,
  );

  constructor(private readonly groceryLists: GroceryListsService) {}

  public ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.groceryLists
      .getLists()
      .pipe(
        switchMap((lists) =>
          lists.length > 0 ? of(lists[0]) : this.groceryLists.createList(DEFAULT_LIST_NAME),
        ),
      )
      .subscribe({
        next: (list) => {
          this.list.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  protected onListChanged(list: GroceryList): void {
    this.list.set(list);
    this.actionError.set(null);
  }

  protected removeSelected(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.removePurchasedItems(list.id).subscribe({
      next: (updated) => this.onListChanged(updated),
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }
}
