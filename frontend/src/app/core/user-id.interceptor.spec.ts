import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEMO_USER_ID, userIdInterceptor } from './user-id.interceptor';

describe('userIdInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([userIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds the user id header to backend calls', () => {
    client.get('/api/grocery-lists').subscribe();

    const request = http.expectOne('/api/grocery-lists').request;
    expect(request.headers.get('x-user-id')).toBe(DEMO_USER_ID);
  });

  it('leaves other requests alone', () => {
    client.get('/assets/data.json').subscribe();

    expect(http.expectOne('/assets/data.json').request.headers.has('x-user-id')).toBe(false);
  });
});
