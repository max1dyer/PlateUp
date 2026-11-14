import { QuantityDto } from '../../common/dto/quantity.dto';

/** Body of `PATCH /pantry/:itemId`. Omitted fields stay unchanged. */
export class UpdatePantryItemDto {
  public readonly name?: string;
  public readonly quantity?: QuantityDto;
  /** New expiration date (`YYYY-MM-DD`); null clears it. */
  public readonly expiresOn?: string | null;
}
