import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { groceryList } from '../grocery-list/grocery-list.fixtures';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { pantryItem } from '../pantry/pantry.fixtures';
import { PantryItem } from '../pantry/pantry.models';
import { PantryService } from '../pantry/pantry.service';
import { AddToGroceryPanel } from './add-to-grocery-panel';
import { recipe } from './recipe.fixtures';

describe('AddToGroceryPanel', () => {
  const groceryLists = { getLists: vi.fn(), createList: vi.fn(), addRecipe: vi.fn() };
  const pantry = { getItems: vi.fn() };
  let fixture: ComponentFixture<AddToGroceryPanel>;
  let panel: HTMLElement;

  async function render(pantryItems: PantryItem[] | Error, servings = 2): Promise<void> {
    groceryLists.getLists.mockReturnValue(of([groceryList([], { name: 'Weekly' })]));
    pantry.getItems.mockReturnValue(
      pantryItems instanceof Error ? throwError(() => pantryItems) : of(pantryItems),
    );
    groceryLists.addRecipe.mockReturnValue(of(groceryList([], { name: 'Weekly' })));
    await TestBed.configureTestingModule({
      imports: [AddToGroceryPanel],
      providers: [
        provideRouter([]),
        { provide: GroceryListsService, useValue: groceryLists },
        { provide: PantryService, useValue: pantry },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AddToGroceryPanel);
    const testRecipe = recipe();
    fixture.componentRef.setInput('recipe', testRecipe);
    fixture.componentRef.setInput('servings', servings);
    // Mirror the recipe page's "Add all to Grocery" button: every ingredient, whole-recipe mode.
    fixture.componentRef.setInput('ingredients', testRecipe.ingredients);
    fixture.componentRef.setInput('addWholeRecipe', true);
    fixture.detectChanges();
    panel = fixture.nativeElement as HTMLElement;
  }

  const submit = (): void => {
    (panel.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const text = (selector: string): string[] =>
    [...panel.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  beforeEach(() => vi.resetAllMocks());

  it('adds every ingredient when none are in the pantry', async () => {
    await render([pantryItem({ name: 'Eggs' })]);

    expect(panel.querySelector('.pantry')).toBeNull();
    submit();

    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 2, []);
  });

  it('lists pantry matches with amounts and leaves them off by default', async () => {
    await render([pantryItem({ name: ' rice ', quantity: { amount: 2, unit: 'cup' } })], 4);

    expect(text('.pantry-name')).toEqual(['Rice']);
    expect(text('.pantry-amounts')[0]).toBe('need 2 cups, have 2 cups');
    expect(text('button[type="submit"]')[0]).toBe('Add 1 ingredient');
    submit();

    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 4, ['Rice']);
  });

  it('adds a pantry match anyway when the user ticks it', async () => {
    await render([pantryItem({ name: 'Rice', quantity: { amount: 1, unit: 'cup' } })]);

    (panel.querySelector('.pantry-item input') as HTMLInputElement).click();
    fixture.detectChanges();
    submit();

    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 2, []);
  });

  it('does not submit when every ingredient is already in the pantry', async () => {
    await render([
      pantryItem({ name: 'Rice' }),
      pantryItem({ id: 'item-2', name: 'Chicken breast' }),
    ]);

    submit();

    expect(groceryLists.addRecipe).not.toHaveBeenCalled();
    expect(text('.ui-error')[0]).toContain('already in your pantry');
  });

  it('still adds everything if the pantry cannot be loaded', async () => {
    await render(new Error('offline'));

    submit();

    expect(groceryLists.addRecipe).toHaveBeenCalledWith('list-1', 'recipe-1', 2, []);
  });
});
