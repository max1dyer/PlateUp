export class ReviewRecipeDto {
  /** Whole stars from 1 to 5. */
  public readonly rating!: number;
  public readonly comment?: string;
}
