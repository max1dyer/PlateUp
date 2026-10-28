import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { recipe } from './recipe.fixtures';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecipesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getRecipes and getRecipe call the recipes endpoint', () => {
    const expected = recipe();
    let received: unknown;

    service.getRecipes().subscribe();
    service.getRecipe('recipe-1').subscribe((value) => (received = value));

    expect(http.expectOne({ method: 'GET', url: '/api/recipes' })).toBeTruthy();
    http.expectOne({ method: 'GET', url: '/api/recipes/recipe-1' }).flush(expected);
    expect(received).toEqual(expected);
  });
});
