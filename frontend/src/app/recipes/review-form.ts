import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { Recipe, RecipeReview } from './recipe.models';
import { RecipesService } from './recipes.service';

/** Star rating and comment form (UC24); submitting again replaces the user's earlier review. */
@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule],
  templateUrl: './review-form.html',
  styleUrl: './review-form.css',
})
export class ReviewForm implements OnInit {
  public readonly recipeId = input.required<string>();
  /** The user's current review, if they wrote one, to edit. */
  public readonly existing = input<RecipeReview | null>(null);
  public readonly reviewed = output<Recipe>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    rating: new FormControl(0, { nonNullable: true }),
    comment: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly recipes: RecipesService,
    private readonly toasts: ToastService,
  ) {}

  public ngOnInit(): void {
    const review = this.existing();
    if (review) {
      this.form.setValue({ rating: review.rating, comment: review.comment });
    }
  }

  protected rate(stars: number): void {
    this.form.controls.rating.setValue(stars);
  }

  protected submit(): void {
    const { rating, comment } = this.form.getRawValue();
    if (rating === 0) {
      this.error.set('Choose a star rating.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.recipes.reviewRecipe(this.recipeId(), { rating, comment }).subscribe({
      next: (recipe) => {
        this.saving.set(false);
        this.toasts.success('Thanks! Your review is posted.');
        this.reviewed.emit(recipe);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
