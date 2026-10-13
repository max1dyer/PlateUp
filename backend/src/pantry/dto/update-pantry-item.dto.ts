import { QuantityDto } from '../../common/dto/quantity.dto';

export class UpdatePantryItemDto {
  public readonly name?: string;
  public readonly quantity?: QuantityDto;
}
