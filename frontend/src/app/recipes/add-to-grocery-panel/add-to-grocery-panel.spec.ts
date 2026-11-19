import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { groceryList } from '../../grocery-list/grocery-list.fixtures';
import { GroceryList } from '../../grocery-list/grocery-list.models';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { preferences } from '../../preferences/preferences.fixtures';
import { UserPreferences } from '../../preferences/preferences.models';
import { PreferencesService } from '../../preferences/preferences.service';
import {
  AddToGroceryPanel,
  DEFAULT_LIST_NAME,
  GroceryAddition,
  NEW_LIST,
} from './add-to-grocery-panel';
import { recipe } from '../recipe.fixtures';

describe('AddToGroceryPanel', () => {
  const groceryLists = { getLists: vi.fn(), createList: vi.fn(), addRecipe: vi.fn() };
  const preferencesService = { preferences: signal<UserPreferences | null>(null) };
  let fixture: ComponentFixture<AddToGroceryPanel>;
  let panel: HTMLElement;

  const chicken: GroceryAddition = {
    name: 'Chicken breast',
    cost: 6,
    missingCost: 6,
    covered: false,
  };
  const rice: GroceryAddition = { name: 'Rice', cost: 1, missingCost: 0.5, covered: false };

  async function render(
    lists: GroceryList[] = [groceryList([], { name: 'Weekly' })],
    additions: GroceryAddition[] = [chicken, rice],
    servings = 2,
  ): Promise<void> {
    groceryLists.getLists.mockReturnValue(of(lists));
    groceryLists.addRecipe.mockImplementation((listId: string) =>
      of(groceryList([], { id: listId, name: listId === 'list-1' ? 'Weekly' : 'Groceries' })),
    );
    await TestBed.configureTestingModule({
      imports: [AddToGroceryPanel],
      providers: [
        provideRouter([]),
        { provide: GroceryListsService, useValue: groceryLists },
        { provide: PreferencesService, useValue: preferencesService },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture = TestBed.createComponent(AddToGroceryPanel);
    fixture.componentRef.setInput('recipe', recipe());
    fixture.componentRef.setInput('servings', servings);
    fixture.componentRef.setInput('additions', additions);
    fixture.detectChanges();
    await fixture.whenStable();
    panel = fixture.nativeElement as HTMLElement;
  }

  const buttons = (): HTMLButtonElement[] => [...panel.querySelectorAll('button')];

  async function click(button: HTMLButtonElement): Promise<void> {
    button.click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    preferencesService.preferences.set(null);
  });

  it('shows the target list up front, picking the first existing list', async () => {
    await render();

    const select = panel.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('list-1');
    expect(panel.querySelector('.view-link')).not.toBeNull();
    expect(buttons().map((button) => button.textContent?.trim())).toEqual([
      'Add 2 to Grocery List (2 servings)',
    ]);
  });

  it('counts only the ticked ingredients on the button', async () => {
    await render(undefined, [chicken]);

    expect(buttons()[0].textContent).toContain('Add 1 to Grocery');
  });

  it('adds the ticked ingredients in one click and stays on the page', async () => {
    await render(undefined, [chicken], 4);

    await click(buttons()[0]);

    // The recipe endpoint scales and categorizes every ingredient it adds, and subtracts the
    // pantry since "only what's missing" starts ticked.
    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 4, ['Rice'], true);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(ToastService).toasts()[0].message).toBe('Added 1 ingredient to Weekly');
  });

  it('creates a new list when the user has none, then keeps it selected', async () => {
    groceryLists.createList.mockReturnValue(of(groceryList([], { id: 'list-2' })));
    await render([]);

    const select = panel.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe(NEW_LIST);
    const name = panel.querySelector('input[formcontrolname="newListName"]') as HTMLInputElement;
    expect(name.value).toBe(DEFAULT_LIST_NAME);

    await click(buttons()[0]);

    expect(groceryLists.createList).toHaveBeenCalledWith(DEFAULT_LIST_NAME);
    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-2', 'recipe-1', 2, [], true);
    expect(select.value).toBe('list-2');
    expect(panel.querySelector('input[formcontrolname="newListName"]')).toBeNull();
  });

  it('asks for a name before creating an unnamed list', async () => {
    await render([]);

    const name = panel.querySelector('input[formcontrolname="newListName"]') as HTMLInputElement;
    name.value = '  ';
    name.dispatchEvent(new Event('input'));
    await click(buttons()[0]);

    expect(groceryLists.createList).not.toHaveBeenCalled();
    expect(panel.querySelector('.ui-error')?.textContent).toContain('Name the new list.');
  });

  it('disables the button when nothing is ticked', async () => {
    await render(undefined, []);

    expect(buttons()[0].disabled).toBe(true);
  });

  it('skips fully stocked ingredients and costs only what is missing, unless told otherwise', async () => {
    await render(undefined, [chicken, rice, { ...rice, name: 'Salt', covered: true }]);
    const estimate = () => panel.querySelector('.estimate')?.textContent ?? '';

    expect(buttons()[0].textContent).toContain('Add 2 to Grocery');
    expect(estimate()).toContain('about $6.50');

    (panel.querySelector('#only-missing') as HTMLInputElement).click();
    await fixture.whenStable();

    expect(buttons()[0].textContent).toContain('Add 3 to Grocery');
    expect(estimate()).toContain('about $8.00');
    await click(buttons()[0]);
    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 2, [], false);
  });

  it('compares the estimate with the budget for the chosen servings', async () => {
    preferencesService.preferences.set(preferences({ budgetEnabled: true, maxCostPerServing: 4 }));
    await render(undefined, [chicken, rice], 2);
    const estimate = () => panel.querySelector('.estimate') as HTMLElement;

    expect(estimate().textContent).toContain('within your $8.00 budget for 2 servings');

    fixture.componentRef.setInput('servings', 1);
    await fixture.whenStable();

    expect(estimate().textContent).toContain('$2.50 over your $4.00 budget for 1 serving');
    expect(estimate().classList).toContain('over');
  });
});
