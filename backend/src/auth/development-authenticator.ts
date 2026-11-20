import { AuthHeaders, RequestAuthenticator } from './request-authenticator';

/**
 * Development sign-in, used while Supabase is not configured: trusts the `x-user-id` header the
 * frontend sends after a username-only login. Never use it in a deployed app.
 */
export class DevelopmentAuthenticator extends RequestAuthenticator {
  /** The header's user id; stray whitespace is ignored and a blank id means anonymous. */
  public identify(headers: AuthHeaders): Promise<string | null> {
    return Promise.resolve(headers.userId?.trim() || null);
  }
}
