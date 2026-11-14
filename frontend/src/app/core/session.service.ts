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
  /** The signed-in user's id, restored from browser storage when the app loads. */
  private readonly id = signal<string | null>(readStoredId());
  /** The signed-in user's profile, once it has been loaded from the backend. */
  private readonly profile = signal<User | null>(null);

  /** Read-only views for the rest of the app; only this service changes them. */
  public readonly userId = this.id.asReadonly();
  public readonly currentUser = this.profile.asReadonly();
  public readonly isSignedIn = computed(() => this.profile() !== null);

  /** Starts a session for `user`, or replaces the profile after it changes. */
  public setUser(user: User): void {
    this.id.set(user.id);
    this.profile.set(user);
    writeStoredId(user.id);
  }

  /** Ends the session: forgets the id and profile, here and in browser storage. */
  public clear(): void {
    this.id.set(null);
    this.profile.set(null);
    writeStoredId(null);
  }
}

// Storage can be unavailable (private mode, blocked site data); the app then
// still works, the session just isn't remembered.
/** The remembered user id, or null if there is none or storage is unavailable. */
function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remembers `userId` in browser storage, or forgets it when null. */
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
