/** Body of `POST /recipe-shares/recipes/:recipeId`. */
export class ShareRecipeDto {
  public readonly recipientUsername!: string;
}
