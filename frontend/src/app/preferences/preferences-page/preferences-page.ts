import { Component, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import {
  DIETARY_DISCLAIMER,
  DIETARY_RESTRICTIONS,
  DietaryRestriction,
  MACROS,
  MAX_DAILY_CALORIES,
  MAX_DEFAULT_SERVINGS,
  MAX_MACRO_GRAMS,
  MIN_DAILY_CALORIES,
  Macro,
  MacroGoals,
  PreferenceChanges,
  UserPreferences,
} from '../preferences.models';
import { MacroPlan, planMacros } from '../macro-plan';
import { PreferencesService } from '../preferences.service';

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
  // Option lists and limits used by the template.
  protected readonly restrictionOptions = DIETARY_RESTRICTIONS;
  protected readonly disclaimer = DIETARY_DISCLAIMER;
  protected readonly maxServings = MAX_DEFAULT_SERVINGS;
  protected readonly minCalories = MIN_DAILY_CALORIES;
  protected readonly maxCalories = MAX_DAILY_CALORIES;
  protected readonly maxGrams = MAX_MACRO_GRAMS;
  protected readonly macros = MACROS;

  /** True until the saved preferences have loaded. */
  protected readonly loading = signal(true);
  /** True if the preferences could not be loaded (the page offers a retry). */
  protected readonly loadError = signal(false);
  /** True while a save is in progress. */
  protected readonly saving = signal(false);
  /** True after a successful save, until the user changes something again. */
  protected readonly saved = signal(false);
  /** The last save error to show, or null. */
  protected readonly error = signal<string | null>(null);
  /**
   * The dietary restrictions currently ticked. Kept outside the form because they are checkboxes
   * over a fixed list.
   */
  protected readonly restrictions = signal<ReadonlySet<DietaryRestriction>>(new Set());

  /** Servings and goal fields; blank number fields hold null. */
  protected readonly form = new FormGroup({
    defaultServings: new FormControl<number | null>(null),
    dailyCalories: new FormControl<number | null>(null),
    protein: new FormControl<number | null>(null),
    carbohydrates: new FormControl<number | null>(null),
    fat: new FormControl<number | null>(null),
  });

  /** The form's values as a signal, so `plan` recomputes as the user types. */
  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** How the calorie and macro goals fit together, with any preview or overshoot. */
  protected readonly plan = computed<MacroPlan>(() => {
    const values = this.values();
    return planMacros(numberOrNull(values.dailyCalories), {
      protein: numberOrNull(values.protein),
      carbohydrates: numberOrNull(values.carbohydrates),
      fat: numberOrNull(values.fat),
    });
  });

  /** Widths (as % of the bar) for the calorie bar's segments and goal marker. */
  protected readonly bar = computed(() => {
    const plan = this.plan();
    const macroTotal = MACROS.reduce((sum, { value }) => sum + plan.caloriesByMacro[value], 0);
    // The bar spans whichever is larger, the goal or the macros' total (at least 1 to avoid
    // dividing by zero).
    const scale = Math.max(plan.calories ?? 0, macroTotal, 1);
    const percent = (kcal: number): number => (kcal / scale) * 100;
    return {
      segments: MACROS.map(({ value }) => ({
        macro: value,
        width: percent(plan.caloriesByMacro[value]),
        previewed: plan.preview?.field === value,
      })),
      goal:
        plan.preview?.field === 'calories' || plan.calories === null
          ? null
          : percent(plan.calories),
    };
  });

  constructor(
    private readonly preferences: PreferencesService,
    private readonly toasts: ToastService,
  ) {
    // Any edit means the form no longer matches what was saved.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.saved.set(false));
  }

  /** Loads the saved preferences when the page opens. */
  public ngOnInit(): void {
    this.load();
  }

  /** Fetches the preferences and fills the form, or shows the error state. */
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

  /** True if this restriction's checkbox is ticked. */
  protected isChecked(restriction: DietaryRestriction): boolean {
    return this.restrictions().has(restriction);
  }

  /** Ticks or unticks a restriction. */
  protected toggle(restriction: DietaryRestriction): void {
    this.saved.set(false);
    this.restrictions.update((current) => {
      const next = new Set(current);
      // `delete` returns false when it was not ticked, so tick it instead.
      if (!next.delete(restriction)) {
        next.add(restriction);
      }
      return next;
    });
  }

  /** Empties the calorie and macro goal fields (servings and restrictions are kept). */
  protected clearGoals(): void {
    this.form.patchValue({ dailyCalories: null, protein: null, carbohydrates: null, fat: null });
  }

  /** The preview for `field`, if that is the field being filled in. */
  protected previewFor(field: 'calories' | Macro): number | null {
    const preview = this.plan().preview;
    return preview?.field === field ? preview.value : null;
  }

  /** Copies the previewed value into its field, so it is saved as the user's own goal. */
  protected acceptPreview(): void {
    const preview = this.plan().preview;
    if (preview === null) {
      return;
    }
    const control = preview.field === 'calories' ? 'dailyCalories' : preview.field;
    this.form.controls[control].setValue(preview.value);
  }

  /** A macro's share of the daily calories, for the hint under its field. */
  protected shareOf(macro: Macro): number | null {
    const plan = this.plan();
    if (plan.calories === null || plan.calories === 0) {
      return null;
    }
    return Math.round((plan.caloriesByMacro[macro] / plan.calories) * 100);
  }

  /** Saves the form; the backend validates it and its message is shown if it refuses. */
  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    this.preferences.update(this.changes()).subscribe({
      next: (preferences) => {
        this.saving.set(false);
        // Confirm first, so the message shows even if redisplaying the reply fails.
        this.toasts.success('Your preferences have been saved.');
        this.fill(preferences);
        // After fill(), whose form update would otherwise clear it.
        this.saved.set(true);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  /** Puts saved preferences into the checkboxes and form fields. */
  private fill(preferences: UserPreferences): void {
    this.restrictions.set(new Set(preferences.dietaryRestrictions));
    this.form.setValue({
      defaultServings: preferences.defaultServings,
      dailyCalories: preferences.dailyCalories,
      ...preferences.macroGoals,
    });
  }

  /**
   * The request body; the backend validates it and reports any problem.
   * Previews are not sent: the backend derives the same values, and keeps
   * them in step if the other goals change later.
   */
  private changes(): PreferenceChanges {
    const values: PreferencesForm = this.form.getRawValue();
    const macroGoals: MacroGoals = {
      protein: numberOrNull(values.protein),
      carbohydrates: numberOrNull(values.carbohydrates),
      fat: numberOrNull(values.fat),
    };
    return {
      // Keep the order the options are shown in.
      dietaryRestrictions: this.restrictionOptions
        .map((option) => option.value)
        .filter((value) => this.restrictions().has(value)),
      // A blank servings field is left out, so the saved value is kept.
      ...(values.defaultServings !== null ? { defaultServings: values.defaultServings } : {}),
      dailyCalories: numberOrNull(values.dailyCalories),
      macroGoals,
    };
  }
}

/** Number inputs give null when blank (and `valueChanges` may give undefined). */
function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
