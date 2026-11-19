import { Component, computed, input } from '@angular/core';
import { MAX_STARS } from '../recipe.models';

/**
 * Read-only star rating, e.g. ★★★★☆ for 4 (issue #30). A fractional average such as 4.3 fills
 * the fifth star part way. Screen readers hear "4.3 out of 5 stars" instead of the symbols.
 */
@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css',
})
export class StarRating {
  /** Stars out of five; null (no ratings yet) shows five empty stars. */
  public readonly rating = input.required<number | null>();

  protected readonly stars = Array.from({ length: MAX_STARS }, (_, index) => index);

  /** How full each star is, from 0 to 100 (%). */
  protected readonly fills = computed(() => {
    const rating = Math.min(MAX_STARS, Math.max(0, this.rating() ?? 0));
    return this.stars.map((index) => Math.round(Math.min(1, Math.max(0, rating - index)) * 100));
  });

  /** What screen readers hear. */
  protected readonly label = computed(() => {
    const rating = this.rating();
    return rating === null ? 'No ratings yet' : `${rating} out of ${MAX_STARS} stars`;
  });
}
