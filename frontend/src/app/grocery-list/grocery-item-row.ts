import { Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, switchMap, tap } from 'rxjs';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { formatQuantity } from './grocery-list-format';
import {
  CATEGORIES,
  GroceryItemChanges,
  GroceryList,
  GroceryListItem,
  IngredientCategory,
  UNITS,
  Unit,
} from './grocery-list.models';
import { GroceryListsService } from './grocery-lists.service';

/** One line of the grocery list: check it off, or tap it to edit, delete, or move it to the pantry. */
@Component({
  selector: 'app-grocery-item-row',
  imports: [ReactiveFormsModule],
  templateUrl: './grocery-item-row.html',
  styleUrl: './grocery-item-row.css',
})
export class GroceryItemRow {
  public readonly listId = input.required<string>();
  public readonly item = input.required<GroceryListItem>();
  /** Emits the updated list after any change to this item. */
  public readonly listChanged = output<GroceryList>();

  protected readonly units = UNITS;
  protected readonly categories = CATEGORIES;
  protected readonly formatQuantity = formatQuantity;
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
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

  protected togglePurchased(): void {
    const item = this.item();
    this.send({ purchased: !item.purchased });
  }

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

  protected cancelEditing(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  protected save(): void {
    const { name, amount, unit, category } = this.form.getRawValue();
    if (name.trim().length === 0) {
      this.error.set('Enter an item name.');
      return;
    }
    const quantity = amount === null ? null : { amount, unit };
    this.send({ name, quantity, category }, () => this.editing.set(false));
  }

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
    saveEdits.pipe(switchMap(() => this.groceryLists.moveItemToPantry(listId, itemId))).subscribe({
      next: (list) => {
        this.saving.set(false);
        this.toasts.success(`Moved ${itemName} to your pantry`);
        this.listChanged.emit(list);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

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

  private fail(error: unknown): void {
    this.saving.set(false);
    this.error.set(errorMessage(error));
  }
}
