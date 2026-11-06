import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { AddItemsForm } from './add-items-form';
import { GroceryItemRow } from './grocery-item-row';
import { groupByCategory } from './grocery-list-format';
import { GroceryList } from './grocery-list.models';
import { GroceryListsService } from './grocery-lists.service';

/** Name given to the list created for a user who has none yet. */
export const DEFAULT_LIST_NAME = 'Grocery list';

/** What the list header is doing: just showing the picker, naming a new list, or renaming. */
type ListMode = 'view' | 'create' | 'rename';

/**
 * "Your Grocery List" page (UC12). Shows one of the user's lists (the one in
 * `?list=`, else the first, creating one if they have none) grouped by
 * category, with a picker to switch, create, rename, or delete lists.
 */
@Component({
  selector: 'app-grocery-list-page',
  imports: [AddItemsForm, GroceryItemRow, ReactiveFormsModule],
  templateUrl: './grocery-list-page.html',
  styleUrl: './grocery-list-page.css',
})
export class GroceryListPage implements OnInit {
  protected readonly lists = signal<GroceryList[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly adding = signal(false);
  protected readonly listMode = signal<ListMode>('view');
  protected readonly confirmingDelete = signal(false);
  protected readonly listForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
  });

  protected readonly list = computed(
    () => this.lists().find((list) => list.id === this.selectedId()) ?? null,
  );
  protected readonly groups = computed(() => groupByCategory(this.list()?.items ?? []));
  protected readonly itemCount = computed(() => this.list()?.items.length ?? 0);
  protected readonly inCartCount = computed(
    () => this.list()?.items.filter((item) => item.purchased).length ?? 0,
  );

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  public ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.groceryLists.getLists().subscribe({
      next: (lists) => {
        if (lists.length === 0) {
          this.createFirstList();
          return;
        }
        const wanted = this.route.snapshot.queryParamMap.get('list');
        this.lists.set(lists);
        this.select(lists.some((list) => list.id === wanted) ? wanted : lists[0].id);
        this.loading.set(false);
      },
      error: () => this.failLoading(),
    });
  }

  protected onSelect(event: Event): void {
    this.select((event.target as HTMLSelectElement).value);
  }

  protected onListChanged(list: GroceryList): void {
    this.lists.update((lists) =>
      lists.map((existing) => (existing.id === list.id ? list : existing)),
    );
    this.actionError.set(null);
  }

  protected removeSelected(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.removePurchasedItems(list.id).subscribe({
      next: (updated) => {
        this.onListChanged(updated);
        this.toasts.success(`Removed ${list.items.length - updated.items.length} checked items`);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** Moves the checked items into the pantry; items it can't take stay checked on the list. */
  protected moveSelectedToPantry(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.movePurchasedToPantry(list.id).subscribe({
      next: ({ list: updated, moved, skipped }) => {
        this.onListChanged(updated);
        if (moved.length > 0) {
          this.toasts.success(
            `Moved ${moved.length} ${moved.length === 1 ? 'item' : 'items'} to your pantry`,
          );
        }
        if (skipped.length > 0) {
          this.actionError.set(skipped.map((item) => item.reason).join(' '));
        }
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  protected startCreating(): void {
    this.listForm.setValue({ name: '' });
    this.listMode.set('create');
  }

  protected startRenaming(): void {
    this.listForm.setValue({ name: this.list()?.name ?? '' });
    this.listMode.set('rename');
  }

  protected saveListName(): void {
    const { name } = this.listForm.getRawValue();
    const list = this.list();
    if (name.trim().length === 0) {
      this.actionError.set('Enter a list name.');
      return;
    }
    const creating = this.listMode() === 'create';
    const request: Observable<GroceryList> =
      creating || !list
        ? this.groceryLists.createList(name)
        : this.groceryLists.renameList(list.id, name);
    request.subscribe({
      next: (saved) => {
        if (creating) {
          this.lists.update((lists) => [...lists, saved]);
          this.select(saved.id);
        } else {
          this.onListChanged(saved);
        }
        this.listMode.set('view');
        this.actionError.set(null);
        this.toasts.success(creating ? `Created ${saved.name}` : 'List renamed');
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  protected deleteList(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.deleteList(list.id).subscribe({
      next: () => {
        this.confirmingDelete.set(false);
        this.toasts.success(`Deleted ${list.name}`);
        const remaining = this.lists().filter((other) => other.id !== list.id);
        if (remaining.length === 0) {
          this.createFirstList();
          return;
        }
        this.lists.set(remaining);
        this.select(remaining[0].id);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  private select(listId: string | null): void {
    this.selectedId.set(listId);
    this.adding.set(false);
    this.confirmingDelete.set(false);
    this.actionError.set(null);
    // Keep the address in step so the page can be bookmarked or refreshed.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { list: listId },
      replaceUrl: true,
    });
  }

  private createFirstList(): void {
    this.loading.set(true);
    this.groceryLists.createList(DEFAULT_LIST_NAME).subscribe({
      next: (list) => {
        this.lists.set([list]);
        this.select(list.id);
        this.loading.set(false);
      },
      error: () => this.failLoading(),
    });
  }

  private failLoading(): void {
    this.loadError.set(true);
    this.loading.set(false);
  }
}
