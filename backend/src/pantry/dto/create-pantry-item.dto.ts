import { QuantityDto } from '../../common/dto/quantity.dto';

/** Body of `POST /pantry`. Pantry items always have an amount. */
export class CreatePantryItemDto {
  public readonly name!: string;
  public readonly quantity!: QuantityDto;
  /** Optional expiration date (`YYYY-MM-DD`); null or omitted means none. */
  public readonly expiresOn?: string | null;
}
