import { Component, OnInit, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, map, of, startWith, switchMap } from 'rxjs';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { AddPlannerWeekResult, GroceryList } from '../../grocery-list/grocery-list.models';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';

/** Value of the list picker that means "make a new list". */
export const NEW_LIST = 'new';

/**
 * The planner's "Shop for this week" panel (UC6, issue #37): adds everything
 * the week's planned meals need to a grocery list, combined across meals and,
 * by default, after taking away what the pantry already holds. Afterwards it
 * lists what was added, what the pantry covers, and anything skipped.
 */
@Component({
  selector: 'app-week-grocery-panel',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './week-grocery-panel.html',
  styleUrl: './week-grocery-panel.css',
})
export class WeekGroceryPanel implements OnInit {
  /** First day of the week (`YYYY-MM-DD`). */
  public readonly from = input.required<string>();
  /** Last day of the week (`YYYY-MM-DD`, inclusive). */
  public readonly to = input.required<string>();
  /** The week's heading, used to name a new list, e.g. "September 21–27, 2026". */
  public readonly weekTitle = input.required<string>();
  /** Emits when the user closes the panel. */
  public readonly closed = output<void>();

  protected readonly newList = NEW_LIST;
  /** The user's lists, offered in the picker. */
  protected readonly lists = signal<GroceryList[]>([]);
  /** True until the lists have loaded. */
  protected readonly loading = signal(true);
  /** True while the ingredients are being added. */
  protected readonly saving = signal(false);
  /** The last error to show, or null. */
  protected readonly error = signal<string | null>(null);
  /** What the last add did, shown as a summary; null before the first add. */
  protected readonly result = signal<AddPlannerWeekResult | null>(null);

  /** Target list (or `NEW_LIST`), the new list's name, and whether to allow for the pantry. */
  protected readonly form = new FormGroup({
    listId: new FormControl(NEW_LIST, { nonNullable: true }),
    newListName: new FormControl('', { nonNullable: true }),
    usePantry: new FormControl(true, { nonNullable: true }),
  });

  /** The picked list id as a signal, so the template updates without zone.js. */
  protected readonly listId = toSignal(
    this.form.controls.listId.valueChanges.pipe(startWith(this.form.controls.listId.value)),
    { requireSync: true },
  );

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
  ) {}

  /** Suggests a list name for the week and loads the user's lists (picking the first). */
  public ngOnInit(): void {
    this.form.controls.newListName.setValue(`Groceries for ${this.weekTitle()}`);
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

  /** Adds the week's ingredients, creating the list first when "+ New list" is picked. */
  protected add(): void {
    const { listId, newListName, usePantry } = this.form.getRawValue();
    const name = newListName.trim();
    if (listId === NEW_LIST && name.length === 0) {
      this.error.set('Name the new list.');
      return;
    }
    // Resolve the target list id first, creating the list when "+ New list" is picked.
    const target: Observable<string> =
      listId === NEW_LIST
        ? this.groceryLists.createList(name).pipe(map((list) => list.id))
        : of(listId);

    this.saving.set(true);
    this.error.set(null);
    this.result.set(null);
    target
      .pipe(
        switchMap((id) => this.groceryLists.addPlannerWeek(id, this.from(), this.to(), usePantry)),
      )
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.result.set(result);
          this.remember(result.list);
          const count = result.added.length;
          this.toasts.success(
            `${count} ${count === 1 ? 'item' : 'items'} added to ${result.list.name}`,
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
    this.form.controls.listId.setValue(list.id);
  }
}
