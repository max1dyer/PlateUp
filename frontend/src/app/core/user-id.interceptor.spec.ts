import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { user } from '../users/user.fixtures';
import { SessionService } from './session.service';
import { userIdInterceptor } from './user-id.interceptor';

describe('userIdInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([userIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => http.verify());

  it('adds the signed-in user id header to backend calls', () => {
    session.setUser(user({ id: 'user-7' }));

    client.get('/api/grocery-lists').subscribe();

    expect(http.expectOne('/api/grocery-lists').request.headers.get('x-user-id')).toBe('user-7');
  });

  it('sends no header when nobody is signed in', () => {
    client.get('/api/recipes').subscribe();

    expect(http.expectOne('/api/recipes').request.headers.has('x-user-id')).toBe(false);
  });

  it('leaves other requests alone', () => {
    session.setUser(user());

    client.get('/assets/data.json').subscribe();

    expect(http.expectOne('/assets/data.json').request.headers.has('x-user-id')).toBe(false);
  });
});
