import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the shared nav bar and footer around the page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.nativeElement as HTMLElement;

    expect(app.querySelector('app-site-header nav')).not.toBeNull();
    expect(app.querySelector('router-outlet')).not.toBeNull();
    expect(app.querySelector('app-site-footer .credits')?.textContent).toContain(
      'Developed by Matt Durcan, Max Dyer, Kartik Prabhu, and Will Shockey',
    );
  });
});
