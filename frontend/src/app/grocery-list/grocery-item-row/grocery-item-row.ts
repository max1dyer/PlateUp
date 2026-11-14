import { Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, switchMap, tap } from 'rxjs';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { formatQuantity } from '../grocery-list-format';
import {
  CATEGORIES,
  GroceryItemChanges,
  GroceryList,
  GroceryListItem,
  IngredientCategory,
  UNITS,
  Unit,
} from '../grocery-list.models';
import { GroceryListsService } from '../grocery-lists.service';

/**
 * One line of the grocery list: check it off, or tap it to edit, delete, or
 * move it to the pantry.
 */
@Component({
  selector: 'app-grocery-item-row',
  imports: [ReactiveFormsModule],
  templateUrl: './grocery-item-row.html',
  styleUrl: './grocery-item-row.css',
})
export class GroceryItemRow {
  /** The list this item belongs to. */
  public readonly listId = input.required<string>();
  /** The item shown on this row. */
  public readonly item = input.required<GroceryListItem>();
  /** Emits the updated list after any change to this item. */
  public readonly listChanged = output<GroceryList>();

  protected readonly units = UNITS;
  protected readonly categories = CATEGORIES;
  protected readonly formatQuantity = formatQuantity;
  /** True while the row is expanded into its edit form. */
  protected readonly editing = signal(false);
  /** True while a change is being sent (disables the row's buttons). */
  protected readonly saving = signal(false);
  /** The last error to show under the row, or null. */
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
    category: new FormControl<IngredientCategory>('other', { nonNullable: true }),
  });

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
  ) {}

  /** Checks the item off (into the cart) or back on. */
  protected togglePurchased(): void {
    const item = this.item();
    this.send({ purchased: !item.purchased });
  }

  /** Opens the edit form, filled with the item's current values. */
  protected startEditing(): void {
    const item = this.item();
    this.form.setValue({
      name: item.name,
      amount: item.quantity?.amount ?? null,
      unit: item.quantity?.unit ?? 'piece',
      category: item.category,
    });
    this.form.markAsPristine();
    this.error.set(null);
    this.editing.set(true);
  }

  /** Closes the edit form without saving. */
  protected cancelEditing(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  /** Saves the edit form. Clearing the amount removes the item's quantity. */
  protected save(): void {
    const { name, amount, unit, category } = this.form.getRawValue();
    if (name.trim().length === 0) {
      this.error.set('Enter an item name.');
      return;
    }
    const quantity = amount === null ? null : { amount, unit };
    this.send({ name, quantity, category }, () => this.editing.set(false));
  }

  /** Deletes the item from the list. */
  protected remove(): void {
    this.saving.set(true);
    this.groceryLists.removeItem(this.listId(), this.item().id).subscribe({
      next: (list) => this.listChanged.emit(list),
      error: (error: unknown) => this.fail(error),
    });
  }

  /**
   * Adds the item to the pantry and takes it off the list. Unsaved edits
   * (e.g. an amount just typed in) are saved first so the pantry gets them.
   */
  protected moveToPantry(): void {
    const { name, amount, unit, category } = this.form.getRawValue();
    if (this.form.dirty && name.trim().length === 0) {
      this.error.set('Enter an item name.');
      return;
    }
    const listId = this.listId();
    const itemId = this.item().id;
    const itemName = this.form.dirty ? name.trim() : this.item().name;
    // If the edit saves but the move is refused, the row keeps showing the saved edit.
    const saveEdits: Observable<unknown> = this.form.dirty
      ? this.groceryLists
          .updateItem(listId, itemId, {
            name,
            quantity: amount === null ? null : { amount, unit },
            category,
          })
          .pipe(
            tap((list) => {
              this.form.markAsPristine();
              this.listChanged.emit(list);
            }),
          )
      : of(null);
    this.saving.set(true);
    this.error.set(null);
    // Run the save (if any) first, then the move, as one sequence.
    saveEdits.pipe(switchMap(() => this.groceryLists.moveItemToPantry(listId, itemId))).subscribe({
      next: (list) => {
        this.saving.set(false);
        this.toasts.success(`Moved ${itemName} to your pantry`);
        this.listChanged.emit(list);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** Sends `changes` for this item, then runs `onSuccess` and emits the updated list. */
  private send(changes: GroceryItemChanges, onSuccess?: () => void): void {
    this.saving.set(true);
    this.error.set(null);
    this.groceryLists.updateItem(this.listId(), this.item().id, changes).subscribe({
      next: (list) => {
        this.saving.set(false);
        onSuccess?.();
        this.listChanged.emit(list);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** Stops the spinner and shows the backend's error message. */
  private fail(error: unknown): void {
    this.saving.set(false);
    this.error.set(errorMessage(error));
  }
}
