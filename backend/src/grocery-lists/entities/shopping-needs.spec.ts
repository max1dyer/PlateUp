import { Quantity, Unit } from '../../common/domain/quantity';
import { combineNeeds, shortfall } from './shopping-needs';

describe('shopping needs', () => {
  const need = (name: string, amount: number, unit: Unit) => ({
    name,
    quantity: new Quantity(amount, unit),
  });

  it('combineNeeds merges the same ingredient in compatible units', () => {
    const { needs, skipped } = combineNeeds([
      need('Rice', 1, Unit.Cup),
      need('Chicken', 400, Unit.Gram),
      need(' rice', 0.5, Unit.Cup),
      need('chicken', 1, Unit.Kilogram),
    ]);

    expect(skipped).toEqual([]);
    expect(needs.map((each) => [each.name, each.quantity.amount, each.quantity.unit])).toEqual([
      ['Rice', 1.5, 'cup'],
      ['Chicken', 1400, 'g'],
    ]);
  });

  it('combineNeeds leaves out amounts in units that cannot be combined', () => {
    const { needs, skipped } = combineNeeds([
      need('Garlic', 3, Unit.Piece),
      need('garlic', 1, Unit.Tablespoon),
    ]);

    expect(needs).toHaveLength(1);
    expect(needs[0].quantity.equals(new Quantity(3, Unit.Piece))).toBe(true);
    expect(skipped).toEqual([
      {
        name: 'garlic',
        reason: "garlic is needed in tbsp and piece, which can't be combined; 1 tbsp was left off.",
      },
    ]);
  });

  it('shortfall subtracts pantry stock and reports what is fully covered', () => {
    const result = shortfall(
      [need('Rice', 2, Unit.Cup), need('Milk', 1, Unit.Liter), need('Eggs', 6, Unit.Piece)],
      [need('rice', 0.5, Unit.Cup), need('Milk', 2, Unit.Liter), need('Eggs', 1, Unit.Carton)],
    );

    expect(result.covered).toEqual(['Milk']);
    expect(
      result.toBuy.map((each) => [each.name, each.quantity.amount, each.quantity.unit]),
    ).toEqual([
      ['Rice', 1.5, 'cup'],
      // A carton can't be compared with pieces, so the eggs are still bought.
      ['Eggs', 6, 'piece'],
    ]);
  });
});
