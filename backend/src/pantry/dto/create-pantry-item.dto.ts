import { QuantityDto } from '../../common/dto/quantity.dto';

export class CreatePantryItemDto {
  public readonly name!: string;
  public readonly quantity!: QuantityDto;
}
