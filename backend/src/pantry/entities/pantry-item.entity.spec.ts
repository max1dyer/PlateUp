import { Quantity, Unit } from '../../common/domain/quantity';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { PantryItem } from './pantry-item.entity';

describe('PantryItem', () => {
  const twelve = new Quantity(12, Unit.Piece);

  it('has no expiration date unless one is given', () => {
    expect(new PantryItem('alice', 'Eggs', twelve).expiresOn).toBeNull();
    expect(new PantryItem('alice', 'Eggs', twelve, '2026-09-28').expiresOn).toBe('2026-09-28');
  });

  it('serializes the expiration date', () => {
    const item = new PantryItem('alice', 'Eggs', twelve, '2026-09-28');

    expect(item.toJSON()).toMatchObject({ name: 'Eggs', expiresOn: '2026-09-28' });
  });

  it('rejects an invalid expiration date', () => {
    expect(() => new PantryItem('alice', 'Eggs', twelve, '2026-02-30')).toThrow(
      DomainValidationError,
    );
    const item = new PantryItem('alice', 'Eggs', twelve);
    expect(() => item.setExpiresOn('next week')).toThrow(DomainValidationError);
    expect(item.expiresOn).toBeNull();
  });

  it('setExpiresOn sets and clears the date', () => {
    const item = new PantryItem('alice', 'Eggs', twelve);

    item.setExpiresOn('2026-10-01');
    expect(item.expiresOn).toBe('2026-10-01');
    item.setExpiresOn(null);
    expect(item.expiresOn).toBeNull();
  });

  it('addQuantity keeps the earlier expiration date', () => {
    const item = new PantryItem('alice', 'Milk', new Quantity(1, Unit.Liter), '2026-09-25');

    item.addQuantity(new Quantity(1, Unit.Liter), '2026-10-02');
    expect(item.expiresOn).toBe('2026-09-25');
    item.addQuantity(new Quantity(1, Unit.Liter), '2026-09-23');
    expect(item.expiresOn).toBe('2026-09-23');
    item.addQuantity(new Quantity(1, Unit.Liter));
    expect(item.expiresOn).toBe('2026-09-23');
    expect(item.quantity.equals(new Quantity(4, Unit.Liter))).toBe(true);
  });

  it('addQuantity gives an undated item the new amount’s date', () => {
    const item = new PantryItem('alice', 'Milk', new Quantity(1, Unit.Liter));

    item.addQuantity(new Quantity(1, Unit.Liter), '2026-09-25');

    expect(item.expiresOn).toBe('2026-09-25');
  });
});
