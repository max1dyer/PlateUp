import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { groceryItem, groceryList } from './grocery-list.fixtures';
import { DEFAULT_LIST_NAME, GroceryListPage } from './grocery-list-page';
import { GroceryListsService } from './grocery-lists.service';

describe('GroceryListPage', () => {
  const service = {
    getLists: vi.fn(),
    createList: vi.fn(),
    removePurchasedItems: vi.fn(),
  };

  async function render(): Promise<{
    fixture: ComponentFixture<GroceryListPage>;
    page: HTMLElement;
  }> {
    await TestBed.configureTestingModule({
      imports: [GroceryListPage],
      providers: [{ provide: GroceryListsService, useValue: service }],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroceryListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const text = (page: HTMLElement, selector: string): string[] =>
    [...page.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  beforeEach(() => vi.resetAllMocks());

  it('shows the first list grouped by category with counts', async () => {
    service.getLists.mockReturnValue(
      of([
        groceryList([
          groceryItem({
            id: 'a',
            name: 'Shredded Lettuce',
            quantity: { amount: 1, unit: 'bag' },
            category: 'produce',
          }),
          groceryItem({ id: 'b', name: 'Chicken breast', quantity: { amount: 3, unit: 'lb' } }),
          groceryItem({ id: 'c', name: 'Eggs', purchased: true }),
        ]),
      ]),
    );

    const { page } = await render();

    expect(text(page, '.heading')).toEqual(['All items (3)']);
    expect(text(page, '.summary-text')[0]).toContain('1 of 3 in cart');
    expect(text(page, '.group-label')).toEqual(['Protein', 'Produce']);
    expect(text(page, '.name')).toEqual(['Chicken breast', 'Eggs', 'Shredded Lettuce']);
    expect(text(page, '.quantity')).toEqual(['3 lb', '1 carton', '1 bag']);
    expect(page.querySelectorAll('.card.green')).toHaveLength(1);
    expect(service.createList).not.toHaveBeenCalled();
  });

  it('creates a list when the user has none', async () => {
    service.getLists.mockReturnValue(of([]));
    service.createList.mockReturnValue(of(groceryList()));

    const { page } = await render();

    expect(service.createList).toHaveBeenCalledWith(DEFAULT_LIST_NAME);
    expect(text(page, '.status')[0]).toContain('Your Grocery List is empty.');
  });

  it('shows an error with a retry when the list cannot be loaded', async () => {
    service.getLists.mockReturnValue(throwError(() => new Error('offline')));

    const { page } = await render();

    expect(text(page, '.status')[0]).toContain("We couldn't load your grocery list.");
  });

  it('Remove Selected removes the items in the cart', async () => {
    service.getLists.mockReturnValue(of([groceryList([groceryItem({ purchased: true })])]));
    service.removePurchasedItems.mockReturnValue(of(groceryList()));
    const { fixture, page } = await render();

    (page.querySelector('.remove-selected') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.removePurchasedItems).toHaveBeenCalledWith('list-1');
    expect(text(page, '.heading')).toEqual(['All items (0)']);
  });

  it('+ Add items opens the add form', async () => {
    service.getLists.mockReturnValue(of([groceryList()]));
    const { fixture, page } = await render();

    (page.querySelector('.action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(page.querySelector('app-add-items-form')).not.toBeNull();
    expect(page.querySelector('.action')).toBeNull();
  });
});
