import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  it('shows every navigation link from the design', async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(SiteHeader);
    fixture.detectChanges();
    const header = fixture.nativeElement as HTMLElement;

    const labels = [...header.querySelectorAll('.nav-link')].map((link) =>
      link.textContent?.trim(),
    );

    expect(labels).toEqual([
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
});
