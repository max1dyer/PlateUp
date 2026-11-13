import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SessionService } from '../core/session.service';
import { user } from '../users/user.fixtures';
import { preferences } from './preferences.fixtures';
import { UserPreferences } from './preferences.models';
import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let http: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PreferencesService);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    session.setUser(user({ id: 'u1' }));
  });

  afterEach(() => http.verify());

  it('loads preferences once and then serves them from memory', () => {
    let first: UserPreferences | null = null;
    service.load().subscribe((prefs) => (first = prefs));
    http
      .expectOne({ method: 'GET', url: '/api/users/me/preferences' })
      .flush(preferences({ defaultServings: 3 }));

    service.load().subscribe();

    expect(first).toEqual(preferences({ defaultServings: 3 }));
    expect(service.preferences()?.defaultServings).toBe(3);
  });

  it('gives null when preferences cannot be loaded', () => {
    let result: UserPreferences | null | undefined;
    service.load().subscribe((prefs) => (result = prefs));
    http
      .expectOne('/api/users/me/preferences')
      .flush({ message: 'down' }, { status: 500, statusText: 'Server Error' });

    expect(result).toBeNull();
  });

  it('update patches the changes and remembers the result', () => {
    service.update({ dietaryRestrictions: ['vegan'] }).subscribe();
    const request = http.expectOne({ method: 'PATCH', url: '/api/users/me/preferences' });
    expect(request.request.body).toEqual({ dietaryRestrictions: ['vegan'] });
    request.flush(preferences({ dietaryRestrictions: ['vegan'] }));

    expect(service.preferences()?.dietaryRestrictions).toEqual(['vegan']);
  });

  it("forgets one user's preferences when another signs in", () => {
    service.load().subscribe();
    http.expectOne('/api/users/me/preferences').flush(preferences({ defaultServings: 5 }));

    session.setUser(user({ id: 'u2' }));

    expect(service.preferences()).toBeNull();
  });
});
