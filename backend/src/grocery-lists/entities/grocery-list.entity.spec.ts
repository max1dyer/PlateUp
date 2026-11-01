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

  describe('adding an item that is already on the list', () => {
    it('combines it into one line, ignoring case and extra spaces', () => {
      const eggs = list.addItem('Eggs', new Quantity(1, Unit.Carton));

      const combined = list.addItem(' eggs ', new Quantity(1, Unit.Carton));

      expect(combined).toBe(eggs);
      expect(list.items).toHaveLength(1);
      expect(eggs.quantity?.equals(new Quantity(2, Unit.Carton))).toBe(true);
    });

    it('keeps the existing unit when units are compatible', () => {
      const rice = list.addItem('Rice', new Quantity(1, Unit.Kilogram));

      list.addItem('Rice', new Quantity(500, Unit.Gram));

      expect(rice.quantity?.equals(new Quantity(1.5, Unit.Kilogram))).toBe(true);
    });

    it('refuses an amount in an incompatible unit and leaves the list unchanged', () => {
      const flour = list.addItem('Flour', new Quantity(2, Unit.Cup));

      expect(() => list.addItem('flour', new Quantity(500, Unit.Gram))).toThrow(
        'Flour is already on your list in cup. Add it in a compatible unit, or edit the existing item.',
      );
      expect(list.items).toHaveLength(1);
      expect(flour.quantity?.equals(new Quantity(2, Unit.Cup))).toBe(true);
    });

    it('refuses a different package unit', () => {
      list.addItem('Eggs', new Quantity(1, Unit.Carton));

      expect(() => list.addItem('Eggs', new Quantity(1, Unit.Box))).toThrow(DomainValidationError);
    });

    it('keeps whichever quantity is given when the other is missing', () => {
      const chips = list.addItem('Chips');
      list.addItem('Chips', new Quantity(2, Unit.Bag));
      expect(chips.quantity?.equals(new Quantity(2, Unit.Bag))).toBe(true);

      list.addItem('Chips');
      expect(chips.quantity?.equals(new Quantity(2, Unit.Bag))).toBe(true);
      expect(list.items).toHaveLength(1);
    });

    it('takes the item out of the cart because more is needed', () => {
      const eggs = list.addItem('Eggs', new Quantity(1, Unit.Carton));
      list.updateItem(eggs.id, { purchased: true });

      list.addItem('Eggs', new Quantity(1, Unit.Carton));

      expect(eggs.purchased).toBe(false);
    });

    it('keeps the existing name spelling and category', () => {
      const eggs = list.addItem('Eggs', new Quantity(1, Unit.Carton), IngredientCategory.Protein);

      list.addItem('EGGS', new Quantity(1, Unit.Carton), IngredientCategory.Dairy);

      expect(eggs.name).toBe('Eggs');
      expect(eggs.category).toBe(IngredientCategory.Protein);
    });

    it('still rejects an unknown category', () => {
      list.addItem('Eggs');

      expect(() => list.addItem('Eggs', null, 'junk-food' as IngredientCategory)).toThrow(
        DomainValidationError,
      );
    });
  });

  describe('renaming an item', () => {
    it("refuses another line's ingredient and leaves the item unchanged", () => {
      list.addItem('Milk', new Quantity(1, Unit.Liter));
      const oatMilk = list.addItem('Oat milk', new Quantity(1, Unit.Liter));

      expect(() => list.updateItem(oatMilk.id, { name: ' MILK', purchased: true })).toThrow(
        'Milk is already on your list. Edit that item instead.',
      );
      expect(oatMilk.name).toBe('Oat milk');
      expect(oatMilk.purchased).toBe(false);
    });

    it('allows a new name, or a different spelling of its own name', () => {
      const oatMilk = list.addItem('Oat milk');
      list.addItem('Milk');

      list.updateItem(oatMilk.id, { name: 'Almond milk' });
      expect(oatMilk.name).toBe('Almond milk');

      list.updateItem(oatMilk.id, { name: 'ALMOND MILK' });
      expect(oatMilk.name).toBe('ALMOND MILK');
    });
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
