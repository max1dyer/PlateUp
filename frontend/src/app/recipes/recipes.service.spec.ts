import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { recipe } from './recipe.fixtures';
import { NewRecipe } from './recipe.models';
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

  it('createRecipe, updateRecipe, deleteRecipe and reviewRecipe use the right routes', () => {
    const body = { title: 'Oatmeal' } as NewRecipe;

    service.createRecipe(body).subscribe();
    service.updateRecipe('recipe-1', { servings: 4 }).subscribe();
    service.deleteRecipe('recipe-1').subscribe();
    service.reviewRecipe('recipe-1', { rating: 5, comment: 'Yum' }).subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/recipes' }).request.body).toBe(body);
    expect(http.expectOne({ method: 'PATCH', url: '/api/recipes/recipe-1' }).request.body).toEqual({
      servings: 4,
    });
    expect(http.expectOne({ method: 'DELETE', url: '/api/recipes/recipe-1' })).toBeTruthy();
    expect(
      http.expectOne({ method: 'PUT', url: '/api/recipes/recipe-1/reviews/me' }).request.body,
    ).toEqual({ rating: 5, comment: 'Yum' });
  });
});
