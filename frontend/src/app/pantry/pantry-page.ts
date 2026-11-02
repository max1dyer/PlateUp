import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { UNITS, Unit } from '../grocery-list/grocery-list.models';
import { PantryItemRow } from './pantry-item-row';
import { PantryItem } from './pantry.models';
import { PantryService } from './pantry.service';

/**
 * "Your Pantry" page (UC5, UC11): what the user has on hand. Adding an
 * ingredient that is already there combines the amounts.
 */
@Component({
  selector: 'app-pantry-page',
  imports: [ReactiveFormsModule, PantryItemRow],
  templateUrl: './pantry-page.html',
  styleUrl: './pantry-page.css',
})
export class PantryPage implements OnInit {
  protected readonly items = signal<PantryItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly addError = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly units = UNITS;

  protected readonly shown = computed(() => {
    const needle = this.search().trim().toLowerCase();
    return [...this.items()]
      .filter((item) => item.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(1),
    unit: new FormControl<Unit>('piece', { nonNullable: true }),
  });

  constructor(
    private readonly pantry: PantryService,
    private readonly toasts: ToastService,
  ) {}

  public ngOnInit(): void {
    this.load();
  }

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

  protected add(): void {
    const { name, amount, unit } = this.form.getRawValue();
    if (name.trim().length === 0 || amount === null) {
      this.addError.set('Enter an ingredient and an amount.');
      return;
    }
    this.saving.set(true);
    this.addError.set(null);
    // Clear straight away so the next item can be typed while this one saves.
    this.form.patchValue({ name: '', amount: 1 });
    this.pantry.addItem({ name, quantity: { amount, unit } }).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.onChanged(item);
        this.toasts.success(`${item.name} is in your pantry`);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.form.patchValue({ name, amount });
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

  protected onRemoved(itemId: string): void {
    this.items.update((items) => items.filter((item) => item.id !== itemId));
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
