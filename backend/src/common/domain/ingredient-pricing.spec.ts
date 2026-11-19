import { estimateCost } from './ingredient-pricing';
import { Quantity, Unit } from './quantity';

describe('estimateCost', () => {
  it('prices weights and volumes per kilogram', () => {
    // 1 lb of butter is about 454 g at $11/kg.
    expect(estimateCost('Butter', new Quantity(1, Unit.Pound))).toBe(4.99);
    // 1 l of milk at $1.10 per litre.
    expect(estimateCost('Milk', new Quantity(1, Unit.Liter))).toBe(1.1);
  });

  it('prices counted ingredients per piece', () => {
    expect(estimateCost('Bananas', new Quantity(3, Unit.Piece))).toBe(0.9);
    expect(estimateCost('Large eggs', new Quantity(12, Unit.Piece))).toBe(4.2);
  });

  it('prefers the more specific name, e.g. peanut butter over butter', () => {
    const tbsp = new Quantity(2, Unit.Tablespoon);

    expect(estimateCost('Peanut butter', tbsp)).toBeLessThan(estimateCost('Butter', tbsp));
    expect(estimateCost('Chicken broth', new Quantity(1, Unit.Liter))).toBe(3);
  });

  it('falls back to the store section, and prices packages at a flat rate', () => {
    // "Cumin" is a spice: $40/kg, so 1 tsp (about 4.9 ml) is about 20 cents.
    expect(estimateCost('Cumin', new Quantity(1, Unit.Teaspoon))).toBe(0.2);
    expect(estimateCost('Anything', new Quantity(2, Unit.Can))).toBe(7);
  });

  it('costs nothing for no amount', () => {
    expect(estimateCost('Rice', new Quantity(0, Unit.Cup))).toBe(0);
  });
});
