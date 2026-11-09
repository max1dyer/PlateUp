import { Component, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import {
  DIETARY_DISCLAIMER,
  DIETARY_RESTRICTIONS,
  DietaryRestriction,
  MAX_DAILY_CALORIES,
  MAX_DEFAULT_SERVINGS,
  MIN_DAILY_CALORIES,
  MacroSplit,
  PreferenceChanges,
  UserPreferences,
} from './preferences.models';
import { PreferencesService } from './preferences.service';

/** Form values; blank number inputs give null. */
interface PreferencesForm {
  defaultServings: number | null;
  dailyCalories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
}

/**
 * Preferences page (`/preferences`, UC10): the user's default serving size,
 * dietary restrictions, and daily calorie and macro goals. The recipe feed
 * and recipe page read them through `PreferencesService`.
 */
@Component({
  selector: 'app-preferences-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './preferences-page.html',
  styleUrl: './preferences-page.css',
})
export class PreferencesPage implements OnInit {
  protected readonly restrictionOptions = DIETARY_RESTRICTIONS;
  protected readonly disclaimer = DIETARY_DISCLAIMER;
  protected readonly maxServings = MAX_DEFAULT_SERVINGS;
  protected readonly minCalories = MIN_DAILY_CALORIES;
  protected readonly maxCalories = MAX_DAILY_CALORIES;

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly restrictions = signal<ReadonlySet<DietaryRestriction>>(new Set());

  protected readonly form = new FormGroup({
    defaultServings: new FormControl<number | null>(null),
    dailyCalories: new FormControl<number | null>(null),
    protein: new FormControl<number | null>(null),
    carbohydrates: new FormControl<number | null>(null),
    fat: new FormControl<number | null>(null),
  });

  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Sum of the macro percentages entered so far (blanks count as 0). */
  protected readonly macroTotal = computed(() => {
    const { protein, carbohydrates, fat } = this.values();
    return (protein ?? 0) + (carbohydrates ?? 0) + (fat ?? 0);
  });
  /** Whether any macro percentage has been entered. */
  protected readonly hasMacroSplit = computed(() => {
    const { protein, carbohydrates, fat } = this.values();
    return [protein, carbohydrates, fat].some((value) => value !== null && value !== undefined);
  });

  constructor(
    private readonly preferences: PreferencesService,
    private readonly toasts: ToastService,
  ) {}

  public ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.preferences.load().subscribe((preferences) => {
      this.loading.set(false);
      if (preferences === null) {
        this.loadError.set(true);
      } else {
        this.fill(preferences);
      }
    });
  }

  protected isChecked(restriction: DietaryRestriction): boolean {
    return this.restrictions().has(restriction);
  }

  protected toggle(restriction: DietaryRestriction): void {
    this.restrictions.update((current) => {
      const next = new Set(current);
      if (!next.delete(restriction)) {
        next.add(restriction);
      }
      return next;
    });
  }

  protected clearMacros(): void {
    this.form.patchValue({ protein: null, carbohydrates: null, fat: null });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.preferences.update(this.changes()).subscribe({
      next: (preferences) => {
        this.saving.set(false);
        this.fill(preferences);
        this.toasts.success('Your preferences have been saved.');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  private fill(preferences: UserPreferences): void {
    this.restrictions.set(new Set(preferences.dietaryRestrictions));
    this.form.setValue({
      defaultServings: preferences.defaultServings,
      dailyCalories: preferences.dailyCalories,
      protein: preferences.macroSplit?.protein ?? null,
      carbohydrates: preferences.macroSplit?.carbohydrates ?? null,
      fat: preferences.macroSplit?.fat ?? null,
    });
  }

  /** The request body; the backend validates it and reports any problem. */
  private changes(): PreferenceChanges {
    const values: PreferencesForm = this.form.getRawValue();
    const macroSplit: MacroSplit | null = this.hasMacroSplit()
      ? {
          protein: values.protein ?? 0,
          carbohydrates: values.carbohydrates ?? 0,
          fat: values.fat ?? 0,
        }
      : null;
    return {
      // Keep the order the options are shown in.
      dietaryRestrictions: this.restrictionOptions
        .map((option) => option.value)
        .filter((value) => this.restrictions().has(value)),
      ...(values.defaultServings !== null ? { defaultServings: values.defaultServings } : {}),
      dailyCalories: values.dailyCalories,
      macroSplit,
    };
  }
}
