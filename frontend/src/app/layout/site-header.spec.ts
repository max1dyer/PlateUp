import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '../core/session.service';
import { user } from '../users/user.fixtures';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  beforeEach(() => localStorage.clear());

  async function labels(signedIn: boolean): Promise<(string | undefined)[]> {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([])],
    }).compileComponents();
    if (signedIn) {
      TestBed.inject(SessionService).setUser(user());
    }
    const fixture = TestBed.createComponent(SiteHeader);
    fixture.detectChanges();
    const header = fixture.nativeElement as HTMLElement;
    return [...header.querySelectorAll('.nav-link')].map((link) => link.textContent?.trim());
  }

  it('shows every navigation link from the design', async () => {
    expect(await labels(true)).toEqual([
      'Home',
      'Recipes',
      'Saved',
      'Pantry',
      'Grocery',
      'Planner',
      'Profile',
      'Log out',
    ]);
  });

  it('offers Log in instead of Log out when nobody is signed in', async () => {
    expect((await labels(false)).at(-1)).toBe('Log in');
  });
});
