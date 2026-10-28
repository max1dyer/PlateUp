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
  Carton = 'carton',
  Bag = 'bag',
  Bottle = 'bottle',
  Tube = 'tube',
  Can = 'can',
  Jar = 'jar',
  Box = 'box',
}

/** What a unit measures. Amounts convert only between units of the same dimension. */
export enum Dimension {
  Mass = 'mass',
  Volume = 'volume',
  Count = 'count',
  /** Store packaging (bag, bottle, ...). Sizes vary, so each unit only combines with itself. */
  Package = 'package',
}

interface UnitDefinition {
  dimension: Dimension;
  /** How many of the dimension's base unit (g, ml, piece) one of this unit is. */
  toBase: number;
}

/** Volume units use US customary sizes. */
const UNIT_DEFINITIONS: Record<Unit, UnitDefinition> = {
  [Unit.Gram]: { dimension: Dimension.Mass, toBase: 1 },
  [Unit.Kilogram]: { dimension: Dimension.Mass, toBase: 1000 },
  [Unit.Ounce]: { dimension: Dimension.Mass, toBase: 28.3495 },
  [Unit.Pound]: { dimension: Dimension.Mass, toBase: 453.592 },
  [Unit.Milliliter]: { dimension: Dimension.Volume, toBase: 1 },
  [Unit.Liter]: { dimension: Dimension.Volume, toBase: 1000 },
  [Unit.Teaspoon]: { dimension: Dimension.Volume, toBase: 4.92892 },
  [Unit.Tablespoon]: { dimension: Dimension.Volume, toBase: 14.7868 },
  [Unit.Cup]: { dimension: Dimension.Volume, toBase: 236.588 },
  [Unit.Piece]: { dimension: Dimension.Count, toBase: 1 },
  [Unit.Carton]: { dimension: Dimension.Package, toBase: 1 },
  [Unit.Bag]: { dimension: Dimension.Package, toBase: 1 },
  [Unit.Bottle]: { dimension: Dimension.Package, toBase: 1 },
  [Unit.Tube]: { dimension: Dimension.Package, toBase: 1 },
  [Unit.Can]: { dimension: Dimension.Package, toBase: 1 },
  [Unit.Jar]: { dimension: Dimension.Package, toBase: 1 },
  [Unit.Box]: { dimension: Dimension.Package, toBase: 1 },
};

/**
 * Immutable value object for an amount of an ingredient. Shared by recipes,
 * the pantry, and grocery lists so they can be compared, scaled, converted,
 * and combined the same way.
 *
 * Every amount is stored rounded to two decimal places, whether it was
 * entered, scaled, converted, or summed, so very small amounts can round to 0.
 */
export class Quantity {
  public readonly amount: number;
  public readonly unit: Unit;

  constructor(amount: number, unit: Unit) {
    if (!Object.values(Unit).includes(unit)) {
      throw new DomainValidationError(`Unknown unit "${String(unit)}".`);
    }
    this.amount = Quantity.round(requireNonNegative(amount, 'Quantity amount'));
    this.unit = unit;
  }

  /** Returns a new Quantity multiplied by `factor`, e.g. when changing servings. */
  public scale(factor: number): Quantity {
    return new Quantity(this.amount * requireNonNegative(factor, 'Scale factor'), this.unit);
  }

  /** True if the amounts can be converted and combined, e.g. kg and oz, or bag and bag. */
  public isCompatibleWith(other: Quantity): boolean {
    return Quantity.unitsAreCompatible(this.unit, other.unit);
  }

  /** Returns this amount expressed in `unit`, which must be compatible with this one. */
  public convertTo(unit: Unit): Quantity {
    if (!Quantity.unitsAreCompatible(this.unit, unit)) {
      throw new DomainValidationError(`Cannot convert ${this.unit} to ${String(unit)}.`);
    }
    return new Quantity(
      (this.amount * this.definition.toBase) / UNIT_DEFINITIONS[unit].toBase,
      unit,
    );
  }

  /** Returns the sum of both amounts, expressed in this quantity's unit. */
  public plus(other: Quantity): Quantity {
    if (!this.isCompatibleWith(other)) {
      throw new DomainValidationError(`${other.unit} cannot be combined with ${this.unit}.`);
    }
    const otherInThisUnit =
      (other.amount * UNIT_DEFINITIONS[other.unit].toBase) / this.definition.toBase;
    return new Quantity(this.amount + otherInThisUnit, this.unit);
  }

  public equals(other: Quantity): boolean {
    return this.amount === other.amount && this.unit === other.unit;
  }

  private get definition(): UnitDefinition {
    return UNIT_DEFINITIONS[this.unit];
  }

  /** Same dimension, except package units, which only match themselves (a bag is not a bottle). */
  private static unitsAreCompatible(a: Unit, b: Unit): boolean {
    const first = UNIT_DEFINITIONS[a];
    const second = UNIT_DEFINITIONS[b];
    if (!first || !second || first.dimension !== second.dimension) {
      return false;
    }
    return first.dimension !== Dimension.Package || a === b;
  }

  private static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
