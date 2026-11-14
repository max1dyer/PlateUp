import { Unit } from '../domain/quantity';

/**
 * Request-body shape of an amount and unit. Services turn it into a `Quantity`, which validates it.
 */
export class QuantityDto {
  public readonly amount!: number;
  public readonly unit!: Unit;
}
