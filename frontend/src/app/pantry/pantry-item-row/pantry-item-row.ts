import { Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { formatQuantity } from '../../grocery-list/grocery-list-format';
import { UNITS, Unit } from '../../grocery-list/grocery-list.models';
import { PantryItem } from '../pantry.models';
import { PantryService } from '../pantry.service';

/** One pantry ingredient (UC11): tap it to change its name or amount, or remove it. */
@Component({
  selector: 'app-pantry-item-row',
  imports: [ReactiveFormsModule],
  templateUrl: './pantry-item-row.html',
  styleUrl: './pantry-item-row.css',
})
export class PantryItemRow {
  /** The pantry item shown on this row. */
  public readonly item = input.required<PantryItem>();
  /** Emits the saved item after an edit. */
  public readonly changed = output<PantryItem>();
  /** Emits the item's id after it is deleted. */
  public readonly removed = output<string>();

  protected readonly units = UNITS;
  protected readonly formatQuantity = formatQuantity;
  /** True while the row is expanded into its edit form. */
  protected readonly editing = signal(false);
  /** True while a change is being sent. */
  protected readonly saving = signal(false);
  /** The last error to show under the row, or null. */
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
  });

  constructor(
    private readonly pantry: PantryService,
    private readonly toasts: ToastService,
  ) {}

  /** Opens the edit form, filled with the item's current name and amount. */
  protected startEditing(): void {
    const item = this.item();
    this.form.setValue({
      name: item.name,
      amount: item.quantity.amount,
      unit: item.quantity.unit,
    });
    this.error.set(null);
    this.editing.set(true);
  }

  /**
   * Saves the edited name and amount. Both are required, since a pantry item always has an amount.
   */
  protected save(): void {
    const { name, amount, unit } = this.form.getRawValue();
    if (name.trim().length === 0 || amount === null) {
      this.error.set('Enter a name and an amount.');
      return;
    }
    this.saving.set(true);
    this.pantry.updateItem(this.item().id, { name, quantity: { amount, unit } }).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.editing.set(false);
        this.toasts.success(`Updated ${item.name}`);
        this.changed.emit(item);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** Deletes the item from the pantry. */
  protected remove(): void {
    const item = this.item();
    this.saving.set(true);
    this.pantry.removeItem(item.id).subscribe({
      next: () => {
        this.toasts.success(`Removed ${item.name} from your pantry`);
        this.removed.emit(item.id);
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
