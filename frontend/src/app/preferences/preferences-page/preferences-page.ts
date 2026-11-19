import { Component, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subject, catchError, concatMap, map, of } from 'rxjs';
import { errorMessage } from '../../core/api';
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
  PreferenceChanges,
  UserPreferences,
} from '../preferences.models';
import { MacroPlan, planMacros } from '../macro-plan';
import { PreferencesService } from '../preferences.service';

/** The parts of the page that save separately, so an error in one doesn't block the others. */
export type PreferencesSection = 'sharing' | 'servings' | 'restrictions' | 'goals';

/** The sharing checkboxes' form controls. */
type SharingField = 'blockRecipeShares' | 'blockListInvites' | 'blockListCopies';

/** Where saving stands, for the status line under the title. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** One queued save: which section it came from and what it sends. */
interface SaveRequest {
  section: PreferencesSection;
  changes: PreferenceChanges;
}

/** How a queued save ended: the saved preferences, or the error message. */
type SaveResult =
  | { section: PreferencesSection; saved: UserPreferences }
  | { section: PreferencesSection; error: string };

/**
 * Preferences page (`/preferences`, UC10): the user's default serving size,
 * dietary restrictions, daily calorie and macro goals, and what other users
 * may share with them. The recipe feed
 * and recipe page read them through `PreferencesService`.
 *
 * There is no Save button: checkboxes save when clicked, and number fields when the user leaves
 * them or presses Enter (their `change` event), so nothing is sent mid-typing. Each section sends
 * only its own fields, one save at a time in order. The backend validates; if it refuses, its
 * message shows in that section, a checkbox goes back to its saved state, and a number keeps what
 * the user typed so they can fix it.
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
  /** Where saving stands, for the status line. */
  protected readonly saveState = signal<SaveState>('idle');
  /** The backend's message for each section whose last save failed. */
  protected readonly errors = signal<Partial<Record<PreferencesSection, string>>>({});
  /** Saves queued or in flight. */
  private pendingSaves = 0;
  /** The preferences as last confirmed by the backend. */
  private lastSaved: UserPreferences | null = null;
  /** Saves waiting to be sent; `concatMap` sends them one at a time, in order. */
  private readonly saves = new Subject<SaveRequest>();
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
    blockRecipeShares: new FormControl(false, { nonNullable: true }),
    blockListInvites: new FormControl(false, { nonNullable: true }),
    blockListCopies: new FormControl(false, { nonNullable: true }),
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

  constructor(private readonly preferences: PreferencesService) {
    this.saves
      .pipe(
        concatMap((request) => this.send(request)),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.saveFinished(result));
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

  /** Ticks or unticks a restriction, and saves the restrictions. */
  protected toggle(restriction: DietaryRestriction): void {
    this.restrictions.update((current) => {
      const next = new Set(current);
      // `delete` returns false when it was not ticked, so tick it instead.
      if (!next.delete(restriction)) {
        next.add(restriction);
      }
      return next;
    });
    this.queue('restrictions', {
      // Keep the order the options are shown in.
      dietaryRestrictions: this.restrictionOptions
        .map((option) => option.value)
        .filter((value) => this.restrictions().has(value)),
    });
  }

  /** Saves one sharing checkbox after a click. */
  protected saveSharing(field: SharingField): void {
    this.queue('sharing', { [field]: this.form.controls[field].value });
  }

  /** Saves the default servings once entered. A blank field goes back to the saved value. */
  protected saveServings(): void {
    const servings = numberOrNull(this.form.controls.defaultServings.value);
    if (servings === null) {
      this.form.controls.defaultServings.setValue(this.lastSaved?.defaultServings ?? null);
      return;
    }
    this.queue('servings', { defaultServings: servings });
  }

  /** Saves the calorie and macro goals together, since they are checked against each other. */
  protected saveGoals(): void {
    const values = this.form.getRawValue();
    this.queue('goals', {
      dailyCalories: numberOrNull(values.dailyCalories),
      macroGoals: {
        protein: numberOrNull(values.protein),
        carbohydrates: numberOrNull(values.carbohydrates),
        fat: numberOrNull(values.fat),
      },
    });
  }

  /** Empties the calorie and macro goal fields and saves (servings and restrictions are kept). */
  protected clearGoals(): void {
    this.form.patchValue({ dailyCalories: null, protein: null, carbohydrates: null, fat: null });
    this.saveGoals();
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
    this.saveGoals();
  }

  /** A macro's share of the daily calories, for the hint under its field. */
  protected shareOf(macro: Macro): number | null {
    const plan = this.plan();
    if (plan.calories === null || plan.calories === 0) {
      return null;
    }
    return Math.round((plan.caloriesByMacro[macro] / plan.calories) * 100);
  }

  /** Adds a save to the queue and shows "Saving…". */
  private queue(section: PreferencesSection, changes: PreferenceChanges): void {
    this.pendingSaves++;
    this.saveState.set('saving');
    this.saves.next({ section, changes });
  }

  /** Sends one save; a refusal becomes a result too, so the queue keeps going. */
  private send({ section, changes }: SaveRequest): Observable<SaveResult> {
    return this.preferences.update(changes).pipe(
      map((saved): SaveResult => ({ section, saved })),
      catchError((error: unknown) => of<SaveResult>({ section, error: errorMessage(error) })),
    );
  }

  /**
   * Records how a save ended. Once the queue is empty, the checkboxes are reset to what the
   * backend confirmed (undoing any refused click), and the status shows the outcome. Number fields
   * are left alone so a reply never overwrites what the user is typing.
   */
  private saveFinished(result: SaveResult): void {
    this.pendingSaves--;
    this.errors.update((errors) => {
      const next = { ...errors };
      delete next[result.section];
      return 'error' in result ? { ...next, [result.section]: result.error } : next;
    });
    if ('saved' in result) {
      this.lastSaved = result.saved;
    }
    if (this.pendingSaves > 0) {
      return;
    }
    if (this.lastSaved !== null) {
      this.fillCheckboxes(this.lastSaved);
    }
    this.saveState.set(Object.keys(this.errors()).length > 0 ? 'error' : 'saved');
  }

  /** Puts saved preferences into every field. */
  private fill(preferences: UserPreferences): void {
    this.lastSaved = preferences;
    this.fillCheckboxes(preferences);
    this.form.patchValue({
      defaultServings: preferences.defaultServings,
      dailyCalories: preferences.dailyCalories,
      ...preferences.macroGoals,
    });
  }

  /** Puts saved preferences into the restriction and sharing checkboxes. */
  private fillCheckboxes(preferences: UserPreferences): void {
    this.restrictions.set(new Set(preferences.dietaryRestrictions));
    this.form.patchValue({
      // `?? false` so a reply without a field shows it as off rather than keeping the click.
      blockRecipeShares: preferences.blockRecipeShares ?? false,
      blockListInvites: preferences.blockListInvites ?? false,
      blockListCopies: preferences.blockListCopies ?? false,
    });
  }
}

/** Number inputs give null when blank (and `valueChanges` may give undefined). */
function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
