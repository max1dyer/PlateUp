/** Body of `PATCH /grocery-lists/:listId` (renaming is the only list-level edit). */
export class UpdateGroceryListDto {
  public readonly name!: string;
}
