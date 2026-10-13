import { DomainValidationError } from '../errors/domain-validation.error';
import { requireNonNegative } from './guards';

export enum Unit {
  Gram = 'g',
  Kilogram = 'kg',
  Milliliter = 'ml',
  Liter = 'l',
  Teaspoon = 'tsp',
  Tablespoon = 'tbsp',
  Cup = 'cup',
  Ounce = 'oz',
  Pound = 'lb',
  Piece = 'piece',
}

/**
 * Immutable value object for an amount of an ingredient. Shared by recipes,
 * the pantry, and grocery lists so they can be compared and scaled the same way.
 */
export class Quantity {
  public readonly amount: number;
  public readonly unit: Unit;

  constructor(amount: number, unit: Unit) {
    if (!Object.values(Unit).includes(unit)) {
      throw new DomainValidationError(`Unknown unit "${String(unit)}".`);
    }
    this.amount = requireNonNegative(amount, 'Quantity amount');
    this.unit = unit;
  }

  /** Returns a new Quantity multiplied by `factor`, e.g. when changing servings. */
  public scale(factor: number): Quantity {
    return new Quantity(this.amount * requireNonNegative(factor, 'Scale factor'), this.unit);
  }

  public equals(other: Quantity): boolean {
    return this.amount === other.amount && this.unit === other.unit;
  }
}
