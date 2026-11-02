import { Injectable } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { NewUser, User } from '../users/user.models';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';

/**
 * Signs users in and out and restores a remembered session on page load.
 *
 * TEMPORARY: signing in takes only a username until Supabase authentication
 * replaces it; only this class and the backend's `@CurrentUserId()` change then.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private restored$: Observable<User | null> | null = null;

  constructor(
    private readonly users: UsersService,
    private readonly session: SessionService,
  ) {}

  /**
   * Loads the remembered user's profile once; later calls share the result.
   * A remembered id the backend no longer knows (it keeps data in memory, so
   * a restart forgets everyone) ends the session.
   */
  public restore(): Observable<User | null> {
    if (this.session.currentUser() !== null) {
      return of(this.session.currentUser());
    }
    if (this.session.userId() === null) {
      return of(null);
    }
    this.restored$ ??= this.users.getMe().pipe(
      tap((user) => this.session.setUser(user)),
      catchError(() => {
        this.session.clear();
        return of(null);
      }),
      shareReplay(1),
    );
    return this.restored$;
  }

  public logIn(username: string): Observable<User> {
    return this.users.logIn(username).pipe(tap((user) => this.startSession(user)));
  }

  public register(user: NewUser): Observable<User> {
    return this.users.register(user).pipe(tap((created) => this.startSession(created)));
  }

  public logOut(): void {
    this.restored$ = null;
    this.session.clear();
  }

  private startSession(user: User): void {
    this.restored$ = null;
    this.session.setUser(user);
  }
}
