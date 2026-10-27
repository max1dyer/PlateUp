import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { IngredientCategory } from '../../common/domain/ingredient-category';
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

    expect(list.updateItem(item.id, { purchased: true })).toBe(true);
    expect(list.items[0].purchased).toBe(true);
    expect(list.updateItem('missing', { purchased: true })).toBe(false);
  });

  it('updateItem changes only the given fields', () => {
    const item = list.addItem('Milk', new Quantity(1, Unit.Liter));

    list.updateItem(item.id, { quantity: new Quantity(2, Unit.Liter) });
    expect(item.quantity?.equals(new Quantity(2, Unit.Liter))).toBe(true);
    expect(item.name).toBe('Milk');

    list.updateItem(item.id, { name: 'Oat milk' });
    expect(item.name).toBe('Oat milk');
    expect(item.quantity?.equals(new Quantity(2, Unit.Liter))).toBe(true);
    expect(item.purchased).toBe(false);
  });

  it('updateItem removes the quantity when given null', () => {
    const item = list.addItem('Eggs', new Quantity(12, Unit.Piece));

    list.updateItem(item.id, { quantity: null });

    expect(item.quantity).toBeNull();
  });

  it('updateItem rejects invalid changes without applying any of them', () => {
    const item = list.addItem('Milk');

    expect(() => list.updateItem(item.id, { name: ' ', purchased: true })).toThrow(
      DomainValidationError,
    );
    expect(() => list.updateItem(item.id, { purchased: 'yes' as unknown as boolean })).toThrow(
      DomainValidationError,
    );
    expect(item.name).toBe('Milk');
    expect(item.purchased).toBe(false);
  });

  it('adds items to the Other category unless one is given', () => {
    const chips = list.addItem('Chips');
    const eggs = list.addItem('Eggs', new Quantity(1, Unit.Carton), IngredientCategory.Protein);

    expect(chips.category).toBe(IngredientCategory.Other);
    expect(eggs.category).toBe(IngredientCategory.Protein);
  });

  it('rejects an unknown category', () => {
    const item = list.addItem('Milk', null, IngredientCategory.Dairy);

    expect(() => list.addItem('Chips', null, 'junk-food' as IngredientCategory)).toThrow(
      DomainValidationError,
    );
    expect(() =>
      list.updateItem(item.id, { category: 'junk-food' as IngredientCategory, name: 'Oat milk' }),
    ).toThrow(DomainValidationError);
    expect(item.category).toBe(IngredientCategory.Dairy);
    expect(item.name).toBe('Milk');
  });

  it('updateItem changes the category', () => {
    const item = list.addItem('Lemongrass');

    list.updateItem(item.id, { category: IngredientCategory.Produce });

    expect(item.category).toBe(IngredientCategory.Produce);
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
    list.updateItem(milk.id, { purchased: true });

    expect(list.removePurchasedItems()).toBe(1);
    expect(list.items.map((item) => item.name)).toEqual(['Bread']);
  });

  it('rename changes the name', () => {
    list.rename('Party snacks');
    expect(list.name).toBe('Party snacks');
  });
});
