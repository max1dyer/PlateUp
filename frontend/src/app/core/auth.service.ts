import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, from, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { User } from '../users/user.models';
import { UsersService } from '../users/users.service';
import { API_PREFIX } from './api';
import {
  AuthClientConfig,
  AuthProvider,
  AuthSession,
  LogInDetails,
  ProfileDetails,
  SignUpDetails,
} from './auth.models';
import { SessionService } from './session.service';
import { SupabaseAuthClient } from './supabase-auth.client';

/**
 * Signs users in and out and restores a remembered session on page load.
 *
 * The backend says which sign-in to use (`GET /auth/config`): with Supabase, users sign in with
 * an email and password and the backend gets their access token; otherwise the development
 * sign-in takes a username only. Pages call the same methods either way.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Which sign-in the backend uses, or null until its config has loaded. */
  private readonly providerState = signal<AuthProvider | null>(null);
  /**
   * True when a Supabase user is signed in but has no PlateUp profile yet, e.g. because the
   * username they chose at sign-up was taken in the meantime; the login page asks for one.
   */
  private readonly needsProfileState = signal(false);
  /** The in-flight or finished config request, shared so it is fetched once. */
  private config$: Observable<AuthClientConfig> | null = null;
  /** The in-flight or finished session restore, shared so the profile is fetched only once. */
  private restored$: Observable<User | null> | null = null;

  public readonly provider = this.providerState.asReadonly();
  public readonly needsProfile = this.needsProfileState.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly users: UsersService,
    private readonly session: SessionService,
    private readonly supabase: SupabaseAuthClient,
  ) {}

  /**
   * Loads which sign-in to use (once). With Supabase, also connects its client so token refreshes
   * reach the session. A failed request is retried on the next call.
   */
  public loadConfig(): Observable<AuthClientConfig> {
    this.config$ ??= this.http.get<AuthClientConfig>(`${API_PREFIX}/auth/config`).pipe(
      tap((config) => {
        this.providerState.set(config.provider);
        if (config.provider === 'supabase') {
          this.supabase.connect(config.supabaseUrl, config.supabaseAnonKey, (token) =>
            this.session.setAccessToken(token),
          );
        }
      }),
      catchError((error: unknown) => {
        this.config$ = null;
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    return this.config$;
  }

  /**
   * Loads the remembered user's profile once; later calls share the result. A session the backend
   * no longer accepts (it keeps data in memory, so a restart forgets everyone) ends.
   */
  public restore(): Observable<User | null> {
    if (this.session.currentUser() !== null) {
      return of(this.session.currentUser());
    }
    this.restored$ ??= this.loadConfig().pipe(
      switchMap((config) =>
        config.provider === 'supabase' ? this.restoreSupabase() : this.restoreDevelopment(),
      ),
      catchError(() => {
        this.session.clear();
        return of(null);
      }),
      shareReplay(1),
    );
    return this.restored$;
  }

  /** Signs in with an email and password (Supabase) or a username (development). */
  public logIn(details: LogInDetails): Observable<User> {
    return this.loadConfig().pipe(
      switchMap((config) =>
        config.provider === 'supabase'
          ? from(this.supabase.signIn(details.email, details.password)).pipe(
              switchMap((session) => this.loadProfile(session)),
            )
          : this.users.logIn(details.username),
      ),
      tap((user) => this.startSession(user)),
    );
  }

  /**
   * Creates an account and signs straight into it. Resolves to null when Supabase asks the user
   * to confirm their email first; their profile is created on their first log-in.
   */
  public register(details: SignUpDetails): Observable<User | null> {
    const profile = { username: details.username, displayName: details.displayName };
    return this.loadConfig().pipe(
      switchMap((config) => {
        if (config.provider === 'development') {
          return this.users.register(profile);
        }
        return from(this.supabase.signUp(details.email, details.password, profile)).pipe(
          switchMap((session) =>
            session === null ? of(null) : this.createProfile(session.accessToken, profile),
          ),
        );
      }),
      tap((user) => user !== null && this.startSession(user)),
    );
  }

  /** Creates the missing profile of a signed-in Supabase user (see `needsProfile`). */
  public completeProfile(profile: ProfileDetails): Observable<User> {
    return this.users.createProfile(profile).pipe(tap((user) => this.startSession(user)));
  }

  /** Ends the session, here and with Supabase. */
  public logOut(): void {
    this.restored$ = null;
    this.needsProfileState.set(false);
    this.session.clear();
    void this.supabase.signOut();
  }

  /** Development: loads the remembered user id's profile. */
  private restoreDevelopment(): Observable<User | null> {
    if (this.session.userId() === null) {
      return of(null);
    }
    return this.users.getMe().pipe(tap((user) => this.session.setUser(user)));
  }

  /** Supabase: loads the profile of the session Supabase remembered, if any. */
  private restoreSupabase(): Observable<User | null> {
    return from(this.supabase.currentSession()).pipe(
      switchMap((session) => (session === null ? of(null) : this.loadProfile(session))),
      tap((user) => user !== null && this.session.setUser(user)),
    );
  }

  /**
   * The signed-in Supabase user's profile, creating it from the details saved at sign-up when
   * this is their first log-in. Sets `needsProfile` when it cannot be created.
   */
  private loadProfile(session: AuthSession): Observable<User> {
    this.session.setAccessToken(session.accessToken);
    return this.users.getMe().pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
          return throwError(() => error);
        }
        if (session.profile === null) {
          this.needsProfileState.set(true);
          return throwError(() => error);
        }
        return this.createProfile(session.accessToken, session.profile);
      }),
    );
  }

  /** Creates the profile, asking for another username (via `needsProfile`) if it fails. */
  private createProfile(accessToken: string, profile: ProfileDetails): Observable<User> {
    this.session.setAccessToken(accessToken);
    return this.users.createProfile(profile).pipe(
      catchError((error: unknown) => {
        this.needsProfileState.set(true);
        return throwError(() => error);
      }),
    );
  }

  /** Remembers `user` as signed in and drops any earlier restore so it cannot overwrite them. */
  private startSession(user: User): void {
    this.restored$ = null;
    this.needsProfileState.set(false);
    this.session.setUser(user);
  }
}
