import { IngredientCategory } from '../../common/domain/ingredient-category';
import { QuantityDto } from '../../common/dto/quantity.dto';

/** Body of `POST /pantry`. Pantry items always have an amount. */
export class CreatePantryItemDto {
  public readonly name!: string;
  public readonly quantity!: QuantityDto;
  /** Optional expiration date (`YYYY-MM-DD`); null or omitted means none. */
  public readonly expiresOn?: string | null;
  /** Pantry section; omitted means it is guessed from the name. */
  public readonly category?: IngredientCategory;
}
