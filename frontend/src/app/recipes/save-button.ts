import { Component, computed, input, signal } from '@angular/core';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { SavedRecipesService } from './saved-recipes.service';

/** Heart button that saves or unsaves a recipe in one tap, with a confirmation message. */
@Component({
  selector: 'app-save-button',
  templateUrl: './save-button.html',
  styleUrl: './save-button.css',
})
export class SaveButton {
  public readonly recipeId = input.required<string>();
  public readonly recipeTitle = input('this recipe');

  protected readonly saving = signal(false);
  protected readonly saved = computed(() => this.savedRecipes.isSaved(this.recipeId()));

  constructor(
    private readonly savedRecipes: SavedRecipesService,
    private readonly toasts: ToastService,
  ) {}

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
