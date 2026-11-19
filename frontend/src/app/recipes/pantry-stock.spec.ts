import { StockLevel } from '../pantry/pantry.models';
import { defaultSelection, stockRows } from './pantry-stock';
import { RecipeIngredient } from './recipe.models';

describe('stockRows', () => {
  const oats: RecipeIngredient = {
    name: 'Rolled oats',
    quantity: { amount: 1, unit: 'cup' },
    estimatedCost: 1,
  };
  const butter: RecipeIngredient = {
    name: 'Butter',
    quantity: { amount: 2, unit: 'piece' },
    estimatedCost: 2,
  };
  const rice: RecipeIngredient = {
    name: 'Rice',
    quantity: { amount: 2, unit: 'cup' },
    estimatedCost: 0.6,
  };
  const banana: RecipeIngredient = {
    name: 'Banana',
    quantity: { amount: 1, unit: 'piece' },
    estimatedCost: 0.3,
  };
  const level = (overrides: Partial<StockLevel>): StockLevel => ({
    name: '',
    needed: { amount: 1, unit: 'cup' },
    onHand: null,
    held: null,
    status: 'missing',
    ...overrides,
  });
  const levels: StockLevel[] = [
    level({ onHand: { amount: 0.5, unit: 'cup' }, status: 'partial' }),
    level({ onHand: { amount: 4, unit: 'piece' }, status: 'enough' }),
    level({ held: { amount: 1, unit: 'bag' }, status: 'unknown' }),
    level({}),
  ];

  it('shows how much of each ingredient is on hand, with the cost of what is missing', () => {
    const rows = stockRows([oats, butter, rice, banana], levels);

    expect(rows.map((row) => [row.status, row.percent, row.missingCost])).toEqual([
      ['partial', 50, 0.5],
      ['enough', 100, 0],
      ['unknown', 0, 0.6],
      ['missing', 0, 0.3],
    ]);
  });

  it('recomputes the status for scaled amounts in the same unit', () => {
    // Doubling the servings: 4 sticks of butter needed, and 4 on hand is still enough.
    const doubled = [oats, butter].map((ingredient) => ({
      ...ingredient,
      quantity: { ...ingredient.quantity, amount: ingredient.quantity.amount * 2 },
    }));

    expect(stockRows(doubled, levels).map((row) => [row.status, row.percent])).toEqual([
      ['partial', 25],
      ['enough', 100],
    ]);
  });

  it('treats everything as missing without stock levels', () => {
    expect(stockRows([oats, butter], null).map((row) => row.status)).toEqual([
      'missing',
      'missing',
    ]);
  });

  it('ticks only partly stocked and missing ingredients by default', () => {
    const rows = stockRows([oats, butter, rice, banana], levels);

    expect([...defaultSelection(rows)]).toEqual(['Rolled oats', 'Banana']);
  });
});
