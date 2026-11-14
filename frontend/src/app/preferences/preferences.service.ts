import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { SessionService } from '../core/session.service';
import { PreferenceChanges, UserPreferences } from './preferences.models';

/**
 * The signed-in user's preferences (UC10). Loaded once per user and shared,
 * so the recipe feed and recipe page read them without extra requests.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly baseUrl = `${API_PREFIX}/users/me/preferences`;
  /** The last preferences loaded, tagged with whose they are so a user switch is noticed. */
  private readonly loaded = signal<{ userId: string; preferences: UserPreferences } | null>(null);

  /** The current user's preferences, or null until loaded (or after switching users). */
  public readonly preferences = computed(() => {
    const loaded = this.loaded();
    return loaded !== null && loaded.userId === this.session.userId() ? loaded.preferences : null;
  });

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  /**
   * The current user's preferences, fetched only the first time. A failed
   * load gives null so pages can fall back to showing everything unfiltered.
   */
  public load(): Observable<UserPreferences | null> {
    const current = this.preferences();
    if (current !== null) {
      return of(current);
    }
    return this.http.get<UserPreferences>(this.baseUrl).pipe(
      tap((preferences) => this.remember(preferences)),
      catchError(() => of(null)),
    );
  }

  /** `PATCH /users/me/preferences`: saves changes and caches the result for other pages. */
  public update(changes: PreferenceChanges): Observable<UserPreferences> {
    return this.http
      .patch<UserPreferences>(this.baseUrl, changes)
      .pipe(tap((preferences) => this.remember(preferences)));
  }

  /** Caches preferences for the signed-in user (ignored if no one is signed in). */
  private remember(preferences: UserPreferences): void {
    const userId = this.session.userId();
    if (userId !== null) {
      this.loaded.set({ userId, preferences });
    }
  }
}
