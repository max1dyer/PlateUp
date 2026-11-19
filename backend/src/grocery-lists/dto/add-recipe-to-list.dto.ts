/** Body of `POST /grocery-lists/:listId/recipes`. */
export class AddRecipeToListDto {
  public readonly recipeId!: string;
  /** Defaults to the recipe's own serving count. */
  public readonly servings?: number;
  /**
   * Ingredient names to leave off the list, e.g. ones the user already has in
   * their pantry. Matched like any ingredient name (case and spacing ignored).
   */
  public readonly excludeIngredients?: string[];
}
