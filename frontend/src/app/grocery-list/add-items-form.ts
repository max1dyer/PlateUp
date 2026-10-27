import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from './grocery-list-format';
import {
  CATEGORIES,
  GroceryList,
  IngredientCategory,
  NewGroceryItem,
  UNITS,
  Unit,
} from './grocery-list.models';
import { GroceryListsService } from './grocery-lists.service';

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
  public readonly listId = input.required<string>();
  /** Emits the updated list after each add. */
  public readonly listChanged = output<GroceryList>();
  public readonly closed = output<void>();

  protected readonly units = UNITS;
  protected readonly categories = CATEGORIES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
    category: new FormControl<IngredientCategory>('other', { nonNullable: true }),
  });

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  constructor(private readonly groceryLists: GroceryListsService) {}

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
