import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RecipeSharesService } from './recipe-shares.service';

describe('RecipeSharesService', () => {
  let service: RecipeSharesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecipeSharesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('calls the recipe-shares routes', () => {
    service.getReceived().subscribe();
    service.getShares('r1').subscribe();
    service.share('r1', 'bob').subscribe();
    service.revoke('r1', 'u2').subscribe();

    http.expectOne({ method: 'GET', url: '/api/recipe-shares/received' });
    http.expectOne({ method: 'GET', url: '/api/recipe-shares/recipes/r1' });
    expect(
      http.expectOne({ method: 'POST', url: '/api/recipe-shares/recipes/r1' }).request.body,
    ).toEqual({ recipientUsername: 'bob' });
    http.expectOne({ method: 'DELETE', url: '/api/recipe-shares/recipes/r1/u2' });
  });
});
