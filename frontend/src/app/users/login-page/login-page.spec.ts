import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthProvider } from '../../core/auth.models';
import { AuthService } from '../../core/auth.service';
import { user } from '../user.fixtures';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const auth = {
    logIn: vi.fn(),
    register: vi.fn(),
    completeProfile: vi.fn(),
    loadConfig: vi.fn(),
    provider: signal<AuthProvider | null>('development'),
    needsProfile: signal(false),
  };

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

  const field = (page: HTMLElement, control: string) =>
    page.querySelector(`[formControlName=${control}]`);

  beforeEach(() => {
    vi.resetAllMocks();
    auth.loadConfig.mockReturnValue(of({ provider: 'development' }));
    auth.provider.set('development');
    auth.needsProfile.set(false);
  });

  it('logs in and returns to the page the user asked for', async () => {
    auth.logIn.mockReturnValue(of(user()));
    const { fixture, page } = await render('/pantry');

    type(page, 'username', 'casey');
    submit(page);
    await fixture.whenStable();

    expect(auth.logIn).toHaveBeenCalledWith(expect.objectContaining({ username: 'casey' }));
    expect(field(page, 'email')).toBeNull();
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

    expect(auth.register).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'casey', displayName: 'Casey Cook' }),
    );
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

  it('says so when the backend cannot be reached', async () => {
    auth.loadConfig.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 502 })));

    const { fixture, page } = await render();
    fixture.detectChanges();

    expect(page.querySelector('.ui-error')?.textContent).toContain("couldn't reach PlateUp");
  });

  describe('with Supabase', () => {
    beforeEach(() => auth.provider.set('supabase'));

    it('logs in with an email and password, without a username', async () => {
      auth.logIn.mockReturnValue(of(user()));
      const { fixture, page } = await render();

      expect(field(page, 'username')).toBeNull();
      expect(page.querySelector('.demo')).toBeNull();
      type(page, 'email', 'casey@example.com');
      type(page, 'password', 'secret');
      submit(page);
      await fixture.whenStable();

      expect(auth.logIn).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'casey@example.com', password: 'secret' }),
      );
    });

    it('asks for the password before logging in', async () => {
      const { fixture, page } = await render();

      type(page, 'email', 'casey@example.com');
      submit(page);
      fixture.detectChanges();

      expect(page.querySelector('.ui-error')?.textContent).toBe('Enter your password.');
      expect(auth.logIn).not.toHaveBeenCalled();
    });

    it('asks the user to confirm their email after creating an account', async () => {
      auth.register.mockReturnValue(of(null));
      const { fixture, page } = await render();

      (page.querySelectorAll('.tab')[1] as HTMLButtonElement).click();
      fixture.detectChanges();
      type(page, 'email', 'casey@example.com');
      type(page, 'password', 'secret');
      type(page, 'username', 'casey');
      type(page, 'displayName', 'Casey Cook');
      submit(page);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(page.querySelector('[role=status]')?.textContent).toContain('Check your email');
      expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalled();
    });

    it('lets a signed-in user without a profile choose a username', async () => {
      auth.needsProfile.set(true);
      auth.completeProfile.mockReturnValue(of(user()));
      const { fixture, page } = await render();

      expect(field(page, 'email')).toBeNull();
      expect(page.querySelector('.tabs')).toBeNull();
      type(page, 'username', 'casey2');
      type(page, 'displayName', 'Casey');
      submit(page);
      await fixture.whenStable();

      expect(auth.completeProfile).toHaveBeenCalledWith({
        username: 'casey2',
        displayName: 'Casey',
      });
      expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/home');
    });
  });
});
