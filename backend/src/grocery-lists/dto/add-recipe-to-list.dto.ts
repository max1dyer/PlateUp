/** Body of `POST /grocery-lists/:listId/recipes`. */
export class AddRecipeToListDto {
  public readonly recipeId!: string;
  /** Defaults to the recipe's own serving count. */
  public readonly servings?: number;
}
