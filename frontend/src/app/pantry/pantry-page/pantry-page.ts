import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { today } from '../../core/calendar-date';
import { ToastService } from '../../core/toast.service';
import { UNITS, Unit } from '../../grocery-list/grocery-list.models';
import { PantryItemRow } from '../pantry-item-row/pantry-item-row';
import { expiringItems, expiryAlert, expiryStatus } from '../pantry-expiry';
import { PantryItem } from '../pantry.models';
import { PantryService } from '../pantry.service';

/**
 * "Your Pantry" page (UC5, UC11, UC15): what the user has on hand. Adding an
 * ingredient that is already there combines the amounts. Items that have
 * expired or expire within a week are listed in an alert at the top.
 */
@Component({
  selector: 'app-pantry-page',
  imports: [ReactiveFormsModule, PantryItemRow],
  templateUrl: './pantry-page.html',
  styleUrl: './pantry-page.css',
})
export class PantryPage implements OnInit {
  /** Every item in the pantry, as loaded. */
  protected readonly items = signal<PantryItem[]>([]);
  /** True until the pantry has loaded. */
  protected readonly loading = signal(true);
  /** True if the pantry could not be loaded (the page offers a retry). */
  protected readonly loadError = signal(false);
  /** True while a new item is being added. */
  protected readonly saving = signal(false);
  /** The last error from the add form, or null. */
  protected readonly addError = signal<string | null>(null);
  /** Text typed in the search box. */
  protected readonly search = signal('');
  protected readonly units = UNITS;
  /** Today's date, against which expiration dates are judged. */
  protected readonly today = today();

  /** The expiry alert summary, or null when nothing is expiring. */
  protected readonly alert = computed(() => expiryAlert(this.items(), this.today));
  /** Expired and soon-to-expire items, most urgent first, with their markers. */
  protected readonly expiring = computed(() =>
    expiringItems(this.items(), this.today).map((item) => ({
      item,
      status: expiryStatus(item.expiresOn, this.today),
    })),
  );

  /** The items matching the search, in alphabetical order. */
  protected readonly shown = computed(() => {
    const needle = this.search().trim().toLowerCase();
    return [...this.items()]
      .filter((item) => item.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** The "add an ingredient" form; the amount starts at 1 and the date is optional. */
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(1),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
    expiresOn: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly pantry: PantryService,
    private readonly toasts: ToastService,
  ) {}

  /** Loads the pantry when the page opens. */
  public ngOnInit(): void {
    this.load();
  }

  /** Fetches the user's pantry items. */
  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.pantry.getItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  /**
   * Adds the entered ingredient. If it fails, the entries are put back so nothing has to be
   * retyped.
   */
  protected add(): void {
    const { name, amount, unit, expiresOn } = this.form.getRawValue();
    if (name.trim().length === 0 || amount === null) {
      this.addError.set('Enter an ingredient and an amount.');
      return;
    }
    this.saving.set(true);
    this.addError.set(null);
    // Clear straight away so the next item can be typed while this one saves.
    this.form.patchValue({ name: '', amount: 1, expiresOn: '' });
    // A blank date field means "no expiration date".
    this.pantry
      .addItem({ name, quantity: { amount, unit }, expiresOn: expiresOn || null })
      .subscribe({
        next: (item) => {
          this.saving.set(false);
          this.onChanged(item);
          this.toasts.success(`${item.name} is in your pantry`);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.form.patchValue({ name, amount, expiresOn });
          this.addError.set(errorMessage(error));
        },
      });
  }

  /** Replaces the item if it was already listed (e.g. amounts were combined), else adds it. */
  protected onChanged(item: PantryItem): void {
    this.items.update((items) =>
      items.some((existing) => existing.id === item.id)
        ? items.map((existing) => (existing.id === item.id ? item : existing))
        : [...items, item],
    );
  }

  /** Drops a deleted item from the page. */
  protected onRemoved(itemId: string): void {
    this.items.update((items) => items.filter((item) => item.id !== itemId));
  }

  /** Updates the search text as the user types. */
  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
