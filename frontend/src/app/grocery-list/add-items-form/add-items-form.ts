import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import {
  CATEGORIES,
  GroceryList,
  IngredientCategory,
  NewGroceryItem,
  UNITS,
  Unit,
} from '../grocery-list.models';
import { GroceryListsService } from '../grocery-lists.service';

/**
 * Inline form opened by "+ Add items". It stays open after each add so several
 * items can be entered in a row; "Done" closes it.
 */
@Component({
  selector: 'app-add-items-form',
  imports: [ReactiveFormsModule],
  templateUrl: './add-items-form.html',
  styleUrl: './add-items-form.css',
})
export class AddItemsForm {
  /** The list new items are added to. */
  public readonly listId = input.required<string>();
  /** Emits the updated list after each add. */
  public readonly listChanged = output<GroceryList>();
  /** Emits when the user clicks "Done". */
  public readonly closed = output<void>();

  protected readonly units = UNITS;
  protected readonly categories = CATEGORIES;
  /** True while an item is being added. */
  protected readonly saving = signal(false);
  /** The last validation or server error to show, or null. */
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
    category: new FormControl<IngredientCategory>('other', { nonNullable: true }),
  });

  /** The name field, focused again after each add for quick entry. */
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  constructor(private readonly groceryLists: GroceryListsService) {}

  /**
   * Adds the entered item to the list. The amount is optional; without one the item has no
   * quantity.
   */
  protected add(): void {
    const { name, amount, unit, category } = this.form.getRawValue();
    if (name.trim().length === 0) {
      this.error.set('Enter an item name.');
      return;
    }
    const item: NewGroceryItem = { name, category };
    if (amount !== null) {
      item.quantity = { amount, unit };
    }
    this.saving.set(true);
    this.error.set(null);
    this.groceryLists.addItem(this.listId(), item).subscribe({
      next: (list) => {
        this.saving.set(false);
        // Keep the unit and category: the next item is often from the same aisle.
        this.form.patchValue({ name: '', amount: null });
        this.nameInput().nativeElement.focus();
        this.listChanged.emit(list);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
