import { Injectable } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthError, AuthSession, ProfileDetails } from './auth.models';

/**
 * Thin wrapper around the Supabase JavaScript client's sign-in calls, so the rest of the app (and
 * its tests) never touch the library directly. The library is downloaded only when Supabase is
 * configured, so the development sign-in does not pay for it. Supabase keeps the session in
 * browser storage and refreshes the access token itself.
 *
 * @pattern Adapter — turns the Supabase client's API into the few calls `AuthService` needs.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseAuthClient {
  private client: Promise<SupabaseClient> | null = null;

  /**
   * Creates the client (once) and reports every access-token change, such as a refresh or a
   * sign-out in another tab, to `onToken`.
   */
  public connect(url: string, anonKey: string, onToken: (token: string | null) => void): void {
    this.client ??= import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(url, anonKey);
      client.auth.onAuthStateChange((_event, session) => onToken(session?.access_token ?? null));
      return client;
    });
  }

  /** The remembered session, or null when nobody is signed in. */
  public async currentSession(): Promise<AuthSession | null> {
    const { data, error } = await (await this.connected()).auth.getSession();
    if (error) {
      throw new AuthError(error.message);
    }
    return data.session ? toAuthSession(data.session) : null;
  }

  /** @throws AuthError for a wrong email or password, or an unconfirmed email. */
  public async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await (
      await this.connected()
    ).auth.signInWithPassword({ email, password });
    if (error) {
      throw new AuthError(error.message);
    }
    return toAuthSession(data.session);
  }

  /**
   * Creates the Supabase account, saving `profile` with it. Returns null when the project asks
   * new users to confirm their email first (there is no session until they do).
   *
   * @throws AuthError if the email is taken or the password is too weak.
   */
  public async signUp(
    email: string,
    password: string,
    profile: ProfileDetails,
  ): Promise<AuthSession | null> {
    const { data, error } = await (
      await this.connected()
    ).auth.signUp({ email, password, options: { data: { ...profile } } });
    if (error) {
      throw new AuthError(error.message);
    }
    return data.session ? toAuthSession(data.session) : null;
  }

  /** Ends the Supabase session (a no-op before `connect`). */
  public async signOut(): Promise<void> {
    if (this.client !== null) {
      await (await this.client).auth.signOut();
    }
  }

  /** The client, once `connect` has been called. */
  private connected(): Promise<SupabaseClient> {
    if (this.client === null) {
      return Promise.reject(new AuthError('Sign-in is not ready yet. Please try again.'));
    }
    return this.client;
  }
}

/** The parts of a Supabase session the app uses. */
function toAuthSession(session: Session): AuthSession {
  const metadata = session.user.user_metadata ?? {};
  const username = typeof metadata['username'] === 'string' ? metadata['username'] : '';
  const displayName = typeof metadata['displayName'] === 'string' ? metadata['displayName'] : '';
  return {
    accessToken: session.access_token,
    profile: username && displayName ? { username, displayName } : null,
  };
}
