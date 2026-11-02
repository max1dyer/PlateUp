import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { user } from '../users/user.fixtures';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

describe('AuthService', () => {
  const users = { getMe: vi.fn(), logIn: vi.fn(), register: vi.fn() };
  let auth: AuthService;
  let session: SessionService;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: UsersService, useValue: users }] });
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(SessionService);
  });

  it('logIn starts a session for the returned user', async () => {
    users.logIn.mockReturnValue(of(user({ id: 'user-7' })));

    await firstValueFrom(auth.logIn('casey'));

    expect(users.logIn).toHaveBeenCalledWith('casey');
    expect(session.userId()).toBe('user-7');
    expect(session.isSignedIn()).toBe(true);
  });

  it('register creates the account and signs in', async () => {
    users.register.mockReturnValue(of(user()));

    await firstValueFrom(auth.register({ username: 'casey', displayName: 'Casey' }));

    expect(session.currentUser()?.displayName).toBe('Casey Cook');
  });

  it('restore returns null without asking the backend when nobody was signed in', async () => {
    await expect(firstValueFrom(auth.restore())).resolves.toBeNull();
    expect(users.getMe).not.toHaveBeenCalled();
  });

  it('restore loads the remembered user once', async () => {
    localStorage.setItem('plateup.userId', 'user-1');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: UsersService, useValue: users }] });
    auth = TestBed.inject(AuthService);
    users.getMe.mockReturnValue(of(user()));

    await firstValueFrom(auth.restore());
    await firstValueFrom(auth.restore());

    expect(users.getMe).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(SessionService).isSignedIn()).toBe(true);
  });

  it('restore ends a session the backend no longer knows', async () => {
    session.setUser(user());
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: UsersService, useValue: users }] });
    auth = TestBed.inject(AuthService);
    users.getMe.mockReturnValue(throwError(() => new Error('404')));

    await expect(firstValueFrom(auth.restore())).resolves.toBeNull();
    expect(TestBed.inject(SessionService).userId()).toBeNull();
  });

  it('logOut clears the session', async () => {
    users.logIn.mockReturnValue(of(user()));
    await firstValueFrom(auth.logIn('casey'));

    auth.logOut();

    expect(session.isSignedIn()).toBe(false);
  });
});
