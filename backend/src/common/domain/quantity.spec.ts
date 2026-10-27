import { DomainValidationError } from '../errors/domain-validation.error';
import { Quantity, Unit } from './quantity';

describe('Quantity', () => {
  it('rejects negative amounts', () => {
    expect(() => new Quantity(-1, Unit.Gram)).toThrow(DomainValidationError);
  });

  it('rejects unknown units', () => {
    expect(() => new Quantity(1, 'bucket' as Unit)).toThrow(DomainValidationError);
  });

  it('rounds amounts to two decimal places', () => {
    expect(new Quantity(2.468, Unit.Cup).amount).toBe(2.47);
    expect(new Quantity(0.004, Unit.Kilogram).amount).toBe(0);
  });

  it('scale returns a new quantity and leaves the original unchanged', () => {
    const original = new Quantity(200, Unit.Gram);
    const scaled = original.scale(1.5);

    expect(scaled.equals(new Quantity(300, Unit.Gram))).toBe(true);
    expect(original.amount).toBe(200);
  });

  it('scale rounds the result to two decimal places', () => {
    expect(new Quantity(500, Unit.Gram).scale(1 / 3).amount).toBe(166.67);
  });

  it('equals compares both amount and unit', () => {
    expect(new Quantity(1, Unit.Cup).equals(new Quantity(1, Unit.Cup))).toBe(true);
    expect(new Quantity(1, Unit.Cup).equals(new Quantity(1, Unit.Liter))).toBe(false);
  });

  describe('isCompatibleWith', () => {
    it('is true for units of the same dimension', () => {
      expect(new Quantity(1, Unit.Kilogram).isCompatibleWith(new Quantity(1, Unit.Ounce))).toBe(
        true,
      );
      expect(new Quantity(1, Unit.Cup).isCompatibleWith(new Quantity(1, Unit.Milliliter))).toBe(
        true,
      );
      expect(new Quantity(1, Unit.Piece).isCompatibleWith(new Quantity(3, Unit.Piece))).toBe(true);
    });

    it('is false for units of different dimensions', () => {
      expect(new Quantity(1, Unit.Cup).isCompatibleWith(new Quantity(1, Unit.Gram))).toBe(false);
      expect(new Quantity(1, Unit.Piece).isCompatibleWith(new Quantity(1, Unit.Gram))).toBe(false);
    });
  });

  describe('convertTo', () => {
    it.each([
      [1, Unit.Kilogram, 1000, Unit.Gram],
      [1, Unit.Pound, 453.59, Unit.Gram],
      [16, Unit.Ounce, 1, Unit.Pound],
      [1.5, Unit.Liter, 1500, Unit.Milliliter],
      [1, Unit.Cup, 16, Unit.Tablespoon],
      [3, Unit.Teaspoon, 1, Unit.Tablespoon],
    ])('converts %d %s to %d %s', (amount, from, expected, to) => {
      const converted = new Quantity(amount, from).convertTo(to);

      expect(converted.equals(new Quantity(expected, to))).toBe(true);
    });

    it('rejects conversion between dimensions', () => {
      expect(() => new Quantity(1, Unit.Cup).convertTo(Unit.Gram)).toThrow(DomainValidationError);
    });
  });

  describe('plus', () => {
    it('adds compatible amounts in the unit of the first quantity', () => {
      const total = new Quantity(1, Unit.Kilogram).plus(new Quantity(500, Unit.Gram));

      expect(total.equals(new Quantity(1.5, Unit.Kilogram))).toBe(true);
    });

    it('adds amounts that use the same unit', () => {
      const total = new Quantity(2, Unit.Piece).plus(new Quantity(3, Unit.Piece));

      expect(total.equals(new Quantity(5, Unit.Piece))).toBe(true);
    });

    it('converts before adding volumes', () => {
      const total = new Quantity(2, Unit.Cup).plus(new Quantity(4, Unit.Tablespoon));

      expect(total.equals(new Quantity(2.25, Unit.Cup))).toBe(true);
    });

    it('leaves both original quantities unchanged', () => {
      const first = new Quantity(1, Unit.Kilogram);
      const second = new Quantity(500, Unit.Gram);
      first.plus(second);

      expect(first.amount).toBe(1);
      expect(second.amount).toBe(500);
    });

    it('rejects amounts of different dimensions', () => {
      expect(() => new Quantity(1, Unit.Cup).plus(new Quantity(200, Unit.Gram))).toThrow(
        DomainValidationError,
      );
    });
  });
});
