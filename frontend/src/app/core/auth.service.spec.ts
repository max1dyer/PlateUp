import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { user } from '../users/user.fixtures';
import { UsersService } from '../users/users.service';
import { AuthClientConfig, AuthError } from './auth.models';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { SupabaseAuthClient } from './supabase-auth.client';

describe('AuthService', () => {
  const users = {
    getMe: vi.fn(),
    logIn: vi.fn(),
    register: vi.fn(),
    createProfile: vi.fn(),
  };
  const supabase = {
    connect: vi.fn(),
    currentSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
  const DEVELOPMENT: AuthClientConfig = { provider: 'development' };
  const SUPABASE: AuthClientConfig = {
    provider: 'supabase',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'anon',
  };
  const details = { email: 'casey@example.com', password: 'secret', username: 'casey' };
  const notFound = () => throwError(() => new HttpErrorResponse({ status: 404 }));
  let http: HttpTestingController;

  /** A fresh AuthService (and session), as on a page load. */
  function setUp(): { auth: AuthService; session: SessionService } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsersService, useValue: users },
        { provide: SupabaseAuthClient, useValue: supabase },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return { auth: TestBed.inject(AuthService), session: TestBed.inject(SessionService) };
  }

  /** Subscribes to `request` and answers the config request it makes. */
  function run<T>(request: Observable<T>, config: AuthClientConfig): Promise<T> {
    const result = firstValueFrom(request);
    http.expectOne('/api/auth/config').flush(config);
    return result;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    supabase.signOut.mockResolvedValue(undefined);
  });

  afterEach(() => http.verify());

  describe('development sign-in', () => {
    it('logIn starts a session for the returned user', async () => {
      const { auth, session } = setUp();
      users.logIn.mockReturnValue(of(user({ id: 'user-7' })));

      await run(auth.logIn(details), DEVELOPMENT);

      expect(users.logIn).toHaveBeenCalledWith('casey');
      expect(session.userId()).toBe('user-7');
      expect(session.isSignedIn()).toBe(true);
      expect(auth.provider()).toBe('development');
      expect(supabase.connect).not.toHaveBeenCalled();
    });

    it('register creates the account and signs in', async () => {
      const { auth, session } = setUp();
      users.register.mockReturnValue(of(user()));

      await run(auth.register({ ...details, displayName: 'Casey Cook' }), DEVELOPMENT);

      expect(users.register).toHaveBeenCalledWith({ username: 'casey', displayName: 'Casey Cook' });
      expect(session.currentUser()?.displayName).toBe('Casey Cook');
    });

    it('restore returns null without loading a profile when nobody was signed in', async () => {
      const { auth } = setUp();

      await expect(run(auth.restore(), DEVELOPMENT)).resolves.toBeNull();
      expect(users.getMe).not.toHaveBeenCalled();
    });

    it('restore loads the remembered user once', async () => {
      localStorage.setItem('plateup.userId', 'user-1');
      const { auth, session } = setUp();
      users.getMe.mockReturnValue(of(user()));

      await run(auth.restore(), DEVELOPMENT);
      await firstValueFrom(auth.restore());

      expect(users.getMe).toHaveBeenCalledTimes(1);
      expect(session.isSignedIn()).toBe(true);
    });

    it('restore ends a session the backend no longer knows', async () => {
      localStorage.setItem('plateup.userId', 'user-1');
      const { auth, session } = setUp();
      users.getMe.mockReturnValue(notFound());

      await expect(run(auth.restore(), DEVELOPMENT)).resolves.toBeNull();
      expect(session.userId()).toBeNull();
    });

    it('logOut clears the session', async () => {
      const { auth, session } = setUp();
      users.logIn.mockReturnValue(of(user()));
      await run(auth.logIn(details), DEVELOPMENT);

      auth.logOut();

      expect(session.isSignedIn()).toBe(false);
    });
  });

  describe('Supabase sign-in', () => {
    it('connects the client and keeps the session token up to date', async () => {
      const { auth, session } = setUp();

      await run(auth.loadConfig(), SUPABASE);
      const [url, key, onToken] = supabase.connect.mock.calls[0];
      onToken('refreshed-token');

      expect([url, key]).toEqual(['https://test.supabase.co', 'anon']);
      expect(auth.provider()).toBe('supabase');
      expect(session.accessToken()).toBe('refreshed-token');
    });

    it('logIn signs in with the email and password, then loads the profile', async () => {
      const { auth, session } = setUp();
      supabase.signIn.mockResolvedValue({ accessToken: 'token-1', profile: null });
      users.getMe.mockReturnValue(of(user({ id: 'supabase-id' })));

      await run(auth.logIn(details), SUPABASE);

      expect(supabase.signIn).toHaveBeenCalledWith('casey@example.com', 'secret');
      expect(session.accessToken()).toBe('token-1');
      expect(session.userId()).toBe('supabase-id');
      expect(users.logIn).not.toHaveBeenCalled();
    });

    it('creates the profile saved at sign-up on the first log-in', async () => {
      const { auth, session } = setUp();
      const profile = { username: 'casey', displayName: 'Casey Cook' };
      supabase.signIn.mockResolvedValue({ accessToken: 'token-1', profile });
      users.getMe.mockReturnValue(notFound());
      users.createProfile.mockReturnValue(of(user()));

      await run(auth.logIn(details), SUPABASE);

      expect(users.createProfile).toHaveBeenCalledWith(profile);
      expect(session.isSignedIn()).toBe(true);
    });

    it('asks for a username when the profile cannot be created, then finishes it', async () => {
      const { auth, session } = setUp();
      supabase.signIn.mockResolvedValue({ accessToken: 'token-1', profile: null });
      users.getMe.mockReturnValue(notFound());

      await expect(run(auth.logIn(details), SUPABASE)).rejects.toBeInstanceOf(HttpErrorResponse);
      expect(auth.needsProfile()).toBe(true);

      users.createProfile.mockReturnValue(of(user()));
      await firstValueFrom(auth.completeProfile({ username: 'casey2', displayName: 'Casey' }));
      expect(auth.needsProfile()).toBe(false);
      expect(session.isSignedIn()).toBe(true);
    });

    it('passes on a wrong password from Supabase', async () => {
      const { auth } = setUp();
      supabase.signIn.mockRejectedValue(new AuthError('Invalid login credentials'));

      await expect(run(auth.logIn(details), SUPABASE)).rejects.toThrow('Invalid login credentials');
    });

    it('register creates the account and its profile', async () => {
      const { auth, session } = setUp();
      supabase.signUp.mockResolvedValue({ accessToken: 'token-1', profile: null });
      users.createProfile.mockReturnValue(of(user()));

      const created = await run(auth.register({ ...details, displayName: 'Casey Cook' }), SUPABASE);

      expect(supabase.signUp).toHaveBeenCalledWith('casey@example.com', 'secret', {
        username: 'casey',
        displayName: 'Casey Cook',
      });
      expect(created?.displayName).toBe('Casey Cook');
      expect(session.accessToken()).toBe('token-1');
    });

    it('register resolves to null while the email still needs confirming', async () => {
      const { auth, session } = setUp();
      supabase.signUp.mockResolvedValue(null);

      await expect(
        run(auth.register({ ...details, displayName: 'Casey Cook' }), SUPABASE),
      ).resolves.toBeNull();
      expect(users.createProfile).not.toHaveBeenCalled();
      expect(session.isSignedIn()).toBe(false);
    });

    it('restore loads the profile of the session Supabase remembered', async () => {
      const { auth, session } = setUp();
      supabase.currentSession.mockResolvedValue({ accessToken: 'token-1', profile: null });
      users.getMe.mockReturnValue(of(user()));

      await expect(run(auth.restore(), SUPABASE)).resolves.toEqual(user());
      expect(session.accessToken()).toBe('token-1');
    });

    it('restore returns null when Supabase has no session', async () => {
      const { auth } = setUp();
      supabase.currentSession.mockResolvedValue(null);

      await expect(run(auth.restore(), SUPABASE)).resolves.toBeNull();
      expect(users.getMe).not.toHaveBeenCalled();
    });

    it('logOut signs out of Supabase and forgets the token', async () => {
      const { auth, session } = setUp();
      session.setAccessToken('token-1');

      auth.logOut();

      expect(supabase.signOut).toHaveBeenCalled();
      expect(session.accessToken()).toBeNull();
    });
  });

  it('asks for the config again after a failed request', async () => {
    const { auth } = setUp();

    const failed = firstValueFrom(auth.loadConfig());
    http.expectOne('/api/auth/config').flush(null, { status: 502, statusText: 'Bad Gateway' });
    await expect(failed).rejects.toBeInstanceOf(HttpErrorResponse);

    await expect(run(auth.loadConfig(), DEVELOPMENT)).resolves.toEqual(DEVELOPMENT);
  });
});
