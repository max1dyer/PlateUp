import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { today, toLocalDate } from '../../core/calendar-date';
import { ToastService } from '../../core/toast.service';
import { formatQuantity } from '../../grocery-list/grocery-list-format';
import { UNITS, Unit } from '../../grocery-list/grocery-list.models';
import { expiryStatus } from '../pantry-expiry';
import { PantryItem } from '../pantry.models';
import { PantryService } from '../pantry.service';

/**
 * One pantry ingredient (UC11): tap it to change its name, amount, or
 * expiration date, or remove it. Expired and soon-to-expire items carry a
 * marker such as "Expires in 3 days" (UC15).
 */
@Component({
  selector: 'app-pantry-item-row',
  imports: [DatePipe, ReactiveFormsModule],
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
  protected readonly toLocalDate = toLocalDate;
  /** How close the item is to its expiration date, with the marker to show. */
  protected readonly expiry = computed(() => expiryStatus(this.item().expiresOn, today()));
  /** True while the row is expanded into its edit form. */
  protected readonly editing = signal(false);
  /** True while a change is being sent. */
  protected readonly saving = signal(false);
  /** The last error to show under the row, or null. */
  protected readonly error = signal<string | null>(null);

  /** The edit form; a blank date means "no expiration date". */
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
    expiresOn: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly pantry: PantryService,
    private readonly toasts: ToastService,
  ) {}

  /** Opens the edit form, filled with the item's current values. */
  protected startEditing(): void {
    const item = this.item();
    this.form.setValue({
      name: item.name,
      amount: item.quantity.amount,
      unit: item.quantity.unit,
      expiresOn: item.expiresOn ?? '',
    });
    this.error.set(null);
    this.editing.set(true);
  }

  /**
   * Saves the edited name, amount, and expiration date. The name and amount are
   * required, since a pantry item always has an amount; clearing the date
   * removes it.
   */
  protected save(): void {
    const { name, amount, unit, expiresOn } = this.form.getRawValue();
    if (name.trim().length === 0 || amount === null) {
      this.error.set('Enter a name and an amount.');
      return;
    }
    this.saving.set(true);
    const changes = { name, quantity: { amount, unit }, expiresOn: expiresOn || null };
    this.pantry.updateItem(this.item().id, changes).subscribe({
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
