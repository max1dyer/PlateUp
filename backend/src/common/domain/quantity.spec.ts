import { DomainValidationError } from '../errors/domain-validation.error';
import { Quantity, Unit } from './quantity';

describe('Quantity', () => {
  it('rejects negative amounts', () => {
    expect(() => new Quantity(-1, Unit.Gram)).toThrow(DomainValidationError);
  });

  it('rejects unknown units', () => {
    expect(() => new Quantity(1, 'bucket' as Unit)).toThrow(DomainValidationError);
  });

  it('scale returns a new quantity and leaves the original unchanged', () => {
    const original = new Quantity(200, Unit.Gram);
    const scaled = original.scale(1.5);

    expect(scaled.equals(new Quantity(300, Unit.Gram))).toBe(true);
    expect(original.amount).toBe(200);
  });

  it('equals compares both amount and unit', () => {
    expect(new Quantity(1, Unit.Cup).equals(new Quantity(1, Unit.Cup))).toBe(true);
    expect(new Quantity(1, Unit.Cup).equals(new Quantity(1, Unit.Liter))).toBe(false);
  });
});
