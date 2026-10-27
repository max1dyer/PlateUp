import { QuantityDto } from '../../common/dto/quantity.dto';

/** Partial edit of a grocery item; omitted fields stay unchanged. */
export class UpdateGroceryItemDto {
  public readonly name?: string;
  /** `null` removes the quantity from the item. */
  public readonly quantity?: QuantityDto | null;
  public readonly purchased?: boolean;
}
