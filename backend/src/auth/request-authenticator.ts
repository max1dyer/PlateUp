/** The request headers an authenticator may look at. */
export interface AuthHeaders {
  /** The `Authorization` header, e.g. `Bearer eyJ...`. */
  authorization?: string;
  /** The development-only `x-user-id` header. */
  userId?: string;
}

/**
 * Works out which user made a request. This abstract class is the DI token; `AuthModule` binds
 * it to `SupabaseAuthenticator` or `DevelopmentAuthenticator` depending on `AuthConfig`, so the
 * guard and controllers never know which sign-in is in use.
 *
 * @pattern Strategy — interchangeable ways of identifying the caller.
 */
export abstract class RequestAuthenticator {
  /**
   * The id of the signed-in user, or null for an anonymous request.
   *
   * @throws UnauthorizedException if the request carries credentials that are not valid.
   */
  public abstract identify(headers: AuthHeaders): Promise<string | null>;
}
