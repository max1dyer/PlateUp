import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { Quantity, Unit } from '../../common/domain/quantity';
import { GroceryList } from './grocery-list.entity';

describe('GroceryList', () => {
  let list: GroceryList;

  beforeEach(() => {
    list = new GroceryList('owner', 'Weekly shop');
  });

  it('requires a name', () => {
    expect(() => new GroceryList('owner', '')).toThrow(DomainValidationError);
  });

  it('adds items with an optional quantity', () => {
    list.addItem('Chips');
    list.addItem('Eggs', new Quantity(12, Unit.Piece));

    expect(list.items.map((item) => item.name)).toEqual(['Chips', 'Eggs']);
    expect(list.items[0].quantity).toBeNull();
  });

  it('marks items purchased and reports unknown items', () => {
    const item = list.addItem('Milk');

    expect(list.setItemPurchased(item.id, true)).toBe(true);
    expect(list.items[0].purchased).toBe(true);
    expect(list.setItemPurchased('missing', true)).toBe(false);
  });

  it('removes a single item', () => {
    const item = list.addItem('Milk');

    expect(list.removeItem(item.id)).toBe(true);
    expect(list.items).toHaveLength(0);
    expect(list.removeItem(item.id)).toBe(false);
  });

  it('removePurchasedItems keeps unpurchased items', () => {
    const milk = list.addItem('Milk');
    list.addItem('Bread');
    list.setItemPurchased(milk.id, true);

    expect(list.removePurchasedItems()).toBe(1);
    expect(list.items.map((item) => item.name)).toEqual(['Bread']);
  });

  it('rename changes the name', () => {
    list.rename('Party snacks');
    expect(list.name).toBe('Party snacks');
  });
});
