import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('shows the links and team credits', async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();
    const footer = fixture.nativeElement as HTMLElement;

    const links = [...footer.querySelectorAll('.footer-link')].map((link) => link.textContent);

    expect(links).toEqual(['Contact Us', 'Learn About Us']);
    expect(footer.querySelector('.credits')?.textContent).toContain('Will Shockey');
  });
});
