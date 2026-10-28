import { IngredientCategory } from '../../common/domain/ingredient-category';
import { QuantityDto } from '../../common/dto/quantity.dto';

export class AddGroceryItemDto {
  public readonly name!: string;
  public readonly quantity?: QuantityDto;
  /** Defaults to `other`. */
  public readonly category?: IngredientCategory;
}
