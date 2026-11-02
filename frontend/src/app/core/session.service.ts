import { Injectable, computed, signal } from '@angular/core';
import { User } from '../users/user.models';

/** Browser storage key for the signed-in user's id. */
const STORAGE_KEY = 'plateup.userId';

/**
 * Who is signed in. Holds the user's id (remembered across visits) and their
 * profile once loaded. It makes no HTTP calls itself, so the HTTP interceptor
 * can depend on it; signing in and out goes through `AuthService`.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly id = signal<string | null>(readStoredId());
  private readonly profile = signal<User | null>(null);

  public readonly userId = this.id.asReadonly();
  public readonly currentUser = this.profile.asReadonly();
  public readonly isSignedIn = computed(() => this.profile() !== null);

  /** Starts a session for `user`, or replaces the profile after it changes. */
  public setUser(user: User): void {
    this.id.set(user.id);
    this.profile.set(user);
    writeStoredId(user.id);
  }

  public clear(): void {
    this.id.set(null);
    this.profile.set(null);
    writeStoredId(null);
  }
}

// Storage can be unavailable (private mode, blocked site data); the app then
// still works, the session just isn't remembered.
function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(userId: string | null): void {
  try {
    if (userId === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, userId);
    }
  } catch {
    // See above: not remembering the session is acceptable.
  }
}
