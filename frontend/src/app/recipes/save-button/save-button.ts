import { Component, computed, input, signal } from '@angular/core';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { SavedRecipesService } from '../saved-recipes.service';

/** Heart button that saves or unsaves a recipe in one tap, with a confirmation message. */
@Component({
  selector: 'app-save-button',
  templateUrl: './save-button.html',
  styleUrl: './save-button.css',
})
export class SaveButton {
  /** The recipe this button saves. */
  public readonly recipeId = input.required<string>();
  /** Used in the confirmation message, e.g. "Saved Tomato Basil Pasta". */
  public readonly recipeTitle = input('this recipe');

  /** True while the request is in flight (disables the button). */
  protected readonly saving = signal(false);
  /** Whether the recipe is saved, read from the signed-in user's profile. */
  protected readonly saved = computed(() => this.savedRecipes.isSaved(this.recipeId()));

  constructor(
    private readonly savedRecipes: SavedRecipesService,
    private readonly toasts: ToastService,
  ) {}

  /** Saves or unsaves the recipe and confirms with a toast. */
  protected toggle(event: Event): void {
    // The button sits inside recipe cards, which are links.
    event.preventDefault();
    event.stopPropagation();
    const wasSaved = this.saved();
    this.saving.set(true);
    this.savedRecipes.toggle(this.recipeId()).subscribe({
      next: () => {
        this.saving.set(false);
        this.toasts.success(
          wasSaved ? `Removed ${this.recipeTitle()} from Saved` : `Saved ${this.recipeTitle()}`,
        );
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(error));
      },
    });
  }
}
