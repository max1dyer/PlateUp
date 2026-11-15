/** Body of `POST /grocery-lists/:listId/share`. */
export class ShareGroceryListDto {
  public readonly recipientUsername!: string;
}
