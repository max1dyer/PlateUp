import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getUser calls the users endpoint with the id', () => {
    service.getUser('u1').subscribe();

    expect(http.expectOne({ method: 'GET', url: '/api/users/u1' })).toBeTruthy();
  });

  it('register, logIn, getMe and updateMe use the account routes', () => {
    service.register({ username: 'casey', displayName: 'Casey' }).subscribe();
    service.logIn('casey').subscribe();
    service.getMe().subscribe();
    service.updateMe({ bio: 'Hi' }).subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/users' }).request.body).toEqual({
      username: 'casey',
      displayName: 'Casey',
    });
    expect(http.expectOne({ method: 'POST', url: '/api/users/login' }).request.body).toEqual({
      username: 'casey',
    });
    expect(http.expectOne({ method: 'GET', url: '/api/users/me' })).toBeTruthy();
    expect(http.expectOne({ method: 'PATCH', url: '/api/users/me' }).request.body).toEqual({
      bio: 'Hi',
    });
  });

  it('saved-recipe calls use the recipe id', () => {
    service.getSavedRecipes().subscribe();
    service.saveRecipe('r1').subscribe();
    service.unsaveRecipe('r1').subscribe();

    expect(http.expectOne({ method: 'GET', url: '/api/users/me/saved-recipes' })).toBeTruthy();
    expect(http.expectOne({ method: 'PUT', url: '/api/users/me/saved-recipes/r1' })).toBeTruthy();
    expect(
      http.expectOne({ method: 'DELETE', url: '/api/users/me/saved-recipes/r1' }),
    ).toBeTruthy();
  });
});
