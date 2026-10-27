import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GroceryItemRow } from './grocery-item-row';
import { groceryItem, groceryList } from './grocery-list.fixtures';
import { GroceryList } from './grocery-list.models';
import { GroceryListsService } from './grocery-lists.service';

describe('GroceryItemRow', () => {
  const service = { updateItem: vi.fn(), removeItem: vi.fn() };
  let fixture: ComponentFixture<GroceryItemRow>;
  let row: HTMLElement;
  let emitted: GroceryList[];

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [GroceryItemRow],
      providers: [{ provide: GroceryListsService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(GroceryItemRow);
    fixture.componentRef.setInput('listId', 'list-1');
    fixture.componentRef.setInput(
      'item',
      groceryItem({ name: 'Milk', quantity: { amount: 1, unit: 'l' }, category: 'dairy' }),
    );
    emitted = [];
    fixture.componentInstance.listChanged.subscribe((list) => emitted.push(list));
    fixture.detectChanges();
    row = fixture.nativeElement as HTMLElement;
  });

  const click = (selector: string): void => {
    (row.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  it('shows the name and formatted quantity', () => {
    expect(row.querySelector('.name')?.textContent).toBe('Milk');
    expect(row.querySelector('.quantity')?.textContent).toBe('1 l');
  });

  it('the checkbox toggles purchased and emits the updated list', () => {
    const updated = groceryList();
    service.updateItem.mockReturnValue(of(updated));

    click('.checkbox');

    expect(service.updateItem).toHaveBeenCalledWith('list-1', 'item-1', { purchased: true });
    expect(emitted).toEqual([updated]);
  });

  it('editing saves name, quantity and category', () => {
    service.updateItem.mockReturnValue(of(groceryList()));
    click('.details');
    fixture.componentInstance['form'].patchValue({ name: 'Oat milk', amount: 2 });

    click('.primary');

    expect(service.updateItem).toHaveBeenCalledWith('list-1', 'item-1', {
      name: 'Oat milk',
      quantity: { amount: 2, unit: 'l' },
      category: 'dairy',
    });
    expect(row.querySelector('form')).toBeNull();
  });

  it('a cleared amount removes the quantity', () => {
    service.updateItem.mockReturnValue(of(groceryList()));
    click('.details');
    fixture.componentInstance['form'].patchValue({ amount: null });

    click('.primary');

    expect(service.updateItem.mock.calls[0][2]).toMatchObject({ quantity: null });
  });

  it('shows the backend error and stays in edit mode', () => {
    service.updateItem.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Milk is already on your list. Edit that item instead.' },
          }),
      ),
    );
    click('.details');

    click('.primary');

    expect(row.querySelector('.error')?.textContent).toContain('Edit that item instead.');
    expect(row.querySelector('form')).not.toBeNull();
  });

  it('delete removes the item', () => {
    service.removeItem.mockReturnValue(of(groceryList()));
    click('.details');

    click('.danger');

    expect(service.removeItem).toHaveBeenCalledWith('list-1', 'item-1');
    expect(emitted).toHaveLength(1);
  });
});
