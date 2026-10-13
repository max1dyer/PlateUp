import { QuantityDto } from '../../common/dto/quantity.dto';

export class AddGroceryItemDto {
  public readonly name!: string;
  public readonly quantity?: QuantityDto;
}
