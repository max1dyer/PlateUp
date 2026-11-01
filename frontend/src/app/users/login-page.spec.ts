import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { user } from './user.fixtures';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const auth = { logIn: vi.fn(), register: vi.fn() };

  async function render(
    returnUrl?: string,
  ): Promise<{ fixture: ComponentFixture<LoginPage>; page: HTMLElement }> {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  function type(page: HTMLElement, control: string, value: string): void {
    const input = page.querySelector(`[formControlName=${control}]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(page: HTMLElement): void {
    (page.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  }

  beforeEach(() => vi.resetAllMocks());

  it('logs in and returns to the page the user asked for', async () => {
    auth.logIn.mockReturnValue(of(user()));
    const { fixture, page } = await render('/pantry');

    type(page, 'username', 'casey');
    submit(page);
    await fixture.whenStable();

    expect(auth.logIn).toHaveBeenCalledWith('casey');
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/pantry');
  });

  it('creates an account with a display name, then goes home', async () => {
    auth.register.mockReturnValue(of(user()));
    const { fixture, page } = await render();

    (page.querySelectorAll('.tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    type(page, 'username', 'casey');
    type(page, 'displayName', 'Casey Cook');
    submit(page);
    await fixture.whenStable();

    expect(auth.register).toHaveBeenCalledWith({ username: 'casey', displayName: 'Casey Cook' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it("shows the backend's message when the username is unknown", async () => {
    auth.logIn.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'No account.' } })),
    );
    const { fixture, page } = await render();

    type(page, 'username', 'nobody');
    submit(page);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.querySelector('.ui-error')?.textContent).toBe('No account.');
  });
});
