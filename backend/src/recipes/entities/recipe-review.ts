import { requireIntegerInRange, requireText } from '../../common/domain/guards';

export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** One user's star rating and optional comment on a recipe. Immutable value object. */
export class RecipeReview {
  public readonly reviewerId: string;
  public readonly rating: number;
  public readonly comment: string;

  constructor(
    reviewerId: string,
    rating: number,
    comment: string,
    public readonly reviewedAt: Date = new Date(),
  ) {
    this.reviewerId = requireText(reviewerId, 'Reviewer');
    this.rating = requireIntegerInRange(rating, MIN_RATING, MAX_RATING, 'Rating');
    this.comment = typeof comment === 'string' ? comment.trim() : '';
  }
}
