import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage, formatQuantity, groupByCategory } from './grocery-list-format';
import { groceryItem } from './grocery-list.fixtures';

describe('formatQuantity', () => {
  it.each([
    [{ amount: 3, unit: 'lb' } as const, '3 lb'],
    [{ amount: 1, unit: 'carton' } as const, '1 carton'],
    [{ amount: 2, unit: 'carton' } as const, '2 cartons'],
    [{ amount: 2, unit: 'box' } as const, '2 boxes'],
    [{ amount: 1, unit: 'piece' } as const, '1'],
    [{ amount: 0.5, unit: 'lb' } as const, '1/2 lb'],
    [{ amount: 1.5, unit: 'cup' } as const, '1 1/2 cups'],
    [{ amount: 0.33, unit: 'cup' } as const, '1/3 cup'],
    [{ amount: 1.2, unit: 'kg' } as const, '1.2 kg'],
  ])('formats %o as "%s"', (quantity, expected) => {
    expect(formatQuantity(quantity)).toBe(expected);
  });

  it('shows nothing when there is no quantity', () => {
    expect(formatQuantity(null)).toBe('');
  });
});

describe('groupByCategory', () => {
  it('groups in the design order, labels them, and skips empty categories', () => {
    const lettuce = groceryItem({ id: 'a', name: 'Lettuce', category: 'produce' });
    const chicken = groceryItem({ id: 'b', name: 'Chicken', category: 'protein' });
    const oil = groceryItem({ id: 'c', name: 'Avocado oil', category: 'oil-sauce' });
    const eggs = groceryItem({ id: 'd', name: 'Eggs', category: 'protein' });

    const groups = groupByCategory([lettuce, chicken, oil, eggs]);

    expect(groups.map((group) => group.label)).toEqual(['Protein', 'Produce', 'Oil/Sauce']);
    expect(groups[0].items).toEqual([chicken, eggs]);
  });
});

describe('errorMessage', () => {
  it("uses the backend's message when there is one", () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'Milk is taken.' } });
    expect(errorMessage(error)).toBe('Milk is taken.');
  });

  it('falls back to a general message', () => {
    expect(errorMessage(new Error('offline'))).toBe('Something went wrong. Please try again.');
  });
});
