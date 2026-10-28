import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AddItemsForm } from './add-items-form';
import { groceryList } from './grocery-list.fixtures';
import { GroceryListsService } from './grocery-lists.service';

describe('AddItemsForm', () => {
  const service = { addItem: vi.fn() };
  let fixture: ComponentFixture<AddItemsForm>;
  let form: HTMLElement;

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [AddItemsForm],
      providers: [{ provide: GroceryListsService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(AddItemsForm);
    fixture.componentRef.setInput('listId', 'list-1');
    fixture.detectChanges();
    form = fixture.nativeElement as HTMLElement;
  });

  const submit = (): void => {
    (form.querySelector('.primary') as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  it('adds an item with its quantity and category, then clears the name and amount', () => {
    service.addItem.mockReturnValue(of(groceryList()));
    fixture.componentInstance['form'].setValue({
      name: 'Fish sauce',
      amount: 1,
      unit: 'bottle',
      category: 'oil-sauce',
    });

    submit();

    expect(service.addItem).toHaveBeenCalledWith('list-1', {
      name: 'Fish sauce',
      quantity: { amount: 1, unit: 'bottle' },
      category: 'oil-sauce',
    });
    expect(fixture.componentInstance['form'].getRawValue()).toEqual({
      name: '',
      amount: null,
      unit: 'bottle',
      category: 'oil-sauce',
    });
  });

  it('leaves out the quantity when no amount is given', () => {
    service.addItem.mockReturnValue(of(groceryList()));
    fixture.componentInstance['form'].patchValue({ name: 'Chips' });

    submit();

    expect(service.addItem).toHaveBeenCalledWith('list-1', { name: 'Chips', category: 'other' });
  });

  it('asks for a name instead of sending a blank one', () => {
    submit();

    expect(service.addItem).not.toHaveBeenCalled();
    expect(form.querySelector('.error')?.textContent).toContain('Enter an item name.');
  });

  it('Done closes the form', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));

    (form.querySelector('.plain') as HTMLButtonElement).click();

    expect(closed).toBe(true);
  });
});
