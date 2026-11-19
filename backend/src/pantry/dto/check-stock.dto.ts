import { QuantityDto } from '../../common/dto/quantity.dto';

/** One ingredient line to look up. */
export class StockNeedDto {
  public readonly name!: string;
  public readonly quantity!: QuantityDto;
}

/** Body of `POST /pantry/stock-check`: the ingredients to compare with the pantry. */
export class CheckStockDto {
  public readonly ingredients!: StockNeedDto[];
}
