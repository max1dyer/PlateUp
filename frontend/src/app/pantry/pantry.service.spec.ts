import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { pantryItem } from './pantry.fixtures';
import { PantryService } from './pantry.service';

describe('PantryService', () => {
  let service: PantryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PantryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('covers the pantry CRUD routes', () => {
    let items: unknown;
    const quantity = { amount: 6, unit: 'piece' } as const;

    service.getItems().subscribe((value) => (items = value));
    service.addItem({ name: 'Eggs', quantity }).subscribe();
    service.updateItem('item-1', { quantity }).subscribe();
    service.removeItem('item-1').subscribe();

    http.expectOne({ method: 'GET', url: '/api/pantry' }).flush([pantryItem()]);
    expect(items).toEqual([pantryItem()]);
    expect(http.expectOne({ method: 'POST', url: '/api/pantry' }).request.body).toEqual({
      name: 'Eggs',
      quantity,
    });
    expect(http.expectOne({ method: 'PATCH', url: '/api/pantry/item-1' }).request.body).toEqual({
      quantity,
    });
    expect(http.expectOne({ method: 'DELETE', url: '/api/pantry/item-1' })).toBeTruthy();
  });
});
