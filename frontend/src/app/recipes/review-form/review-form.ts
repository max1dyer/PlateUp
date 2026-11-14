import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { Recipe, RecipeReview } from '../recipe.models';
import { RecipesService } from '../recipes.service';

/** Star rating and comment form (UC24); submitting again replaces the user's earlier review. */
@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule],
  templateUrl: './review-form.html',
  styleUrl: './review-form.css',
})
export class ReviewForm implements OnInit {
  /** The recipe being reviewed. */
  public readonly recipeId = input.required<string>();
  /** The user's current review, if they wrote one, to edit. */
  public readonly existing = input<RecipeReview | null>(null);
  /** Emits the updated recipe after the review is posted. */
  public readonly reviewed = output<Recipe>();

  /** The star buttons, from one to five. */
  protected readonly stars = [1, 2, 3, 4, 5];
  /** True while the review is being posted. */
  protected readonly saving = signal(false);
  /** The last validation or server error to show, or null. */
  protected readonly error = signal<string | null>(null);

  /** Rating 0 means "no stars chosen yet". */
  protected readonly form = new FormGroup({
    rating: new FormControl(0, { nonNullable: true }),
    comment: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly recipes: RecipesService,
    private readonly toasts: ToastService,
  ) {}

  /** Pre-fills the form with the user's existing review, if they have one. */
  public ngOnInit(): void {
    const review = this.existing();
    if (review) {
      this.form.setValue({ rating: review.rating, comment: review.comment });
    }
  }

  /** Sets the rating when a star is clicked. */
  protected rate(stars: number): void {
    this.form.controls.rating.setValue(stars);
  }

  /** Posts the review; a star rating is required, the comment is optional. */
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
