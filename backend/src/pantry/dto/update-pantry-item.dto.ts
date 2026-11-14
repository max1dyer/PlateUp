import { QuantityDto } from '../../common/dto/quantity.dto';

/** Body of `PATCH /pantry/:itemId`. Omitted fields stay unchanged. */
export class UpdatePantryItemDto {
  public readonly name?: string;
  public readonly quantity?: QuantityDto;
}
