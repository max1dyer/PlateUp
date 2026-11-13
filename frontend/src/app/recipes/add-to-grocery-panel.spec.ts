import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastService } from '../core/toast.service';
import { groceryList } from '../grocery-list/grocery-list.fixtures';
import { GroceryList } from '../grocery-list/grocery-list.models';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { AddToGroceryPanel, DEFAULT_LIST_NAME, NEW_LIST } from './add-to-grocery-panel';
import { recipe } from './recipe.fixtures';

describe('AddToGroceryPanel', () => {
  const groceryLists = { getLists: vi.fn(), createList: vi.fn(), addRecipe: vi.fn() };
  let fixture: ComponentFixture<AddToGroceryPanel>;
  let panel: HTMLElement;

  async function render(
    lists: GroceryList[] = [groceryList([], { name: 'Weekly' })],
    owned: string[] = [],
    servings = 2,
  ): Promise<void> {
    groceryLists.getLists.mockReturnValue(of(lists));
    groceryLists.addRecipe.mockImplementation((listId: string) =>
      of(groceryList([], { id: listId, name: listId === 'list-1' ? 'Weekly' : 'Groceries' })),
    );
    await TestBed.configureTestingModule({
      imports: [AddToGroceryPanel],
      providers: [provideRouter([]), { provide: GroceryListsService, useValue: groceryLists }],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture = TestBed.createComponent(AddToGroceryPanel);
    fixture.componentRef.setInput('recipe', recipe());
    fixture.componentRef.setInput('servings', servings);
    fixture.componentRef.setInput('owned', new Set(owned));
    fixture.detectChanges();
    await fixture.whenStable();
    panel = fixture.nativeElement as HTMLElement;
  }

  const buttons = (): HTMLButtonElement[] => [...panel.querySelectorAll('button')];

  async function click(button: HTMLButtonElement): Promise<void> {
    button.click();
    await fixture.whenStable();
  }

  beforeEach(() => vi.resetAllMocks());

  it('shows the target list up front, picking the first existing list', async () => {
    await render();

    const select = panel.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('list-1');
    expect(panel.querySelector('.view-link')).not.toBeNull();
    expect(buttons().map((button) => button.textContent?.trim())).toEqual([
      'Add 2 to Grocery List (2 servings)',
    ]);
  });

  it('counts only the missing ingredients on the button', async () => {
    await render(undefined, ['Rice']);

    expect(buttons()[0].textContent).toContain('Add 1 to Grocery');
  });

  it('adds the missing ingredients in one click and stays on the page', async () => {
    await render(undefined, ['Rice'], 4);

    await click(buttons()[0]);

    // The recipe endpoint scales and categorizes every ingredient it adds.
    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 4, ['Rice']);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(ToastService).toasts()[0].message).toBe('Added 1 ingredient to Weekly');
  });

  it('creates a new list when the user has none, then keeps it selected', async () => {
    groceryLists.createList.mockReturnValue(of(groceryList([], { id: 'list-2' })));
    await render([]);

    const select = panel.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe(NEW_LIST);
    const name = panel.querySelector('input') as HTMLInputElement;
    expect(name.value).toBe(DEFAULT_LIST_NAME);

    await click(buttons()[0]);

    expect(groceryLists.createList).toHaveBeenCalledWith(DEFAULT_LIST_NAME);
    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-2', 'recipe-1', 2, []);
    expect(select.value).toBe('list-2');
    expect(panel.querySelector('input')).toBeNull();
  });

  it('asks for a name before creating an unnamed list', async () => {
    await render([]);

    const name = panel.querySelector('input') as HTMLInputElement;
    name.value = '  ';
    name.dispatchEvent(new Event('input'));
    await click(buttons()[0]);

    expect(groceryLists.createList).not.toHaveBeenCalled();
    expect(panel.querySelector('.ui-error')?.textContent).toContain('Name the new list.');
  });

  it('disables the button when everything is marked as owned', async () => {
    await render(undefined, ['Chicken breast', 'Rice']);

    expect(buttons()[0].disabled).toBe(true);
  });
});
