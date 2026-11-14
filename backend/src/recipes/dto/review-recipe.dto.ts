/** Body of `PUT /recipes/:recipeId/reviews/me`. */
export class ReviewRecipeDto {
  /** Whole stars from 1 to 5. */
  public readonly rating!: number;
  /** Optional written review; omitted means no comment. */
  public readonly comment?: string;
}
