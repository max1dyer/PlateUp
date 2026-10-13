import { Unit } from '../domain/quantity';

export class QuantityDto {
  public readonly amount!: number;
  public readonly unit!: Unit;
}
