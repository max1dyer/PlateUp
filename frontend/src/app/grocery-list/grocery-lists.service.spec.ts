import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { groceryList } from './grocery-list.fixtures';
import { GroceryListsService } from './grocery-lists.service';

describe('GroceryListsService', () => {
  let service: GroceryListsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GroceryListsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getLists and createList call the grocery-lists endpoint', () => {
    service.getLists().subscribe();
    service.createList('Weekly').subscribe();

    expect(http.expectOne({ method: 'GET', url: '/api/grocery-lists' })).toBeTruthy();
    const create = http.expectOne({ method: 'POST', url: '/api/grocery-lists' });
    expect(create.request.body).toEqual({ name: 'Weekly' });
  });

  it('item calls use the list and item ids and return the updated list', () => {
    const updated = groceryList();
    let received: unknown;

    service.addItem('l1', { name: 'Eggs' }).subscribe();
    service.updateItem('l1', 'i1', { purchased: true }).subscribe((list) => (received = list));
    service.removeItem('l1', 'i1').subscribe();
    service.removePurchasedItems('l1').subscribe();

    expect(
      http.expectOne({ method: 'POST', url: '/api/grocery-lists/l1/items' }).request.body,
    ).toEqual({ name: 'Eggs' });
    http.expectOne({ method: 'PATCH', url: '/api/grocery-lists/l1/items/i1' }).flush(updated);
    http.expectOne({ method: 'DELETE', url: '/api/grocery-lists/l1/items/i1' });
    http.expectOne({ method: 'DELETE', url: '/api/grocery-lists/l1/purchased-items' });
    expect(received).toEqual(updated);
  });

  it('addRecipe posts the recipe and servings; renameList and deleteList use the list id', () => {
    service.addRecipe('list-1', 'recipe-1', 6).subscribe();
    service.renameList('list-1', 'Party').subscribe();
    service.deleteList('list-1').subscribe();

    expect(
      http.expectOne({ method: 'POST', url: '/api/grocery-lists/list-1/recipes' }).request.body,
    ).toEqual({ recipeId: 'recipe-1', servings: 6, excludeIngredients: [] });
    expect(
      http.expectOne({ method: 'PATCH', url: '/api/grocery-lists/list-1' }).request.body,
    ).toEqual({ name: 'Party' });
    expect(http.expectOne({ method: 'DELETE', url: '/api/grocery-lists/list-1' })).toBeTruthy();
  });

  it('addRecipe sends the ingredients to leave off', () => {
    service.addRecipe('list-1', 'recipe-1', 2, ['Rice']).subscribe();

    expect(
      http.expectOne({ method: 'POST', url: '/api/grocery-lists/list-1/recipes' }).request.body,
    ).toEqual({ recipeId: 'recipe-1', servings: 2, excludeIngredients: ['Rice'] });
  });

  it('move-to-pantry calls post to the item and purchased-items pantry routes', () => {
    service.moveItemToPantry('l1', 'i1').subscribe();
    service.movePurchasedToPantry('l1').subscribe();

    expect(
      http.expectOne({ method: 'POST', url: '/api/grocery-lists/l1/items/i1/pantry' }),
    ).toBeTruthy();
    expect(
      http.expectOne({ method: 'POST', url: '/api/grocery-lists/l1/purchased-items/pantry' }),
    ).toBeTruthy();
  });

  it('addPlannerWeek posts the date range and pantry choice', () => {
    service.addPlannerWeek('list-1', '2026-09-21', '2026-09-27', false).subscribe();

    const request = http.expectOne({
      method: 'POST',
      url: '/api/grocery-lists/list-1/planner-week',
    });
    expect(request.request.body).toEqual({
      from: '2026-09-21',
      to: '2026-09-27',
      usePantry: false,
    });
    request.flush({ list: groceryList(), added: [], coveredByPantry: [], skipped: [] });
  });
});
