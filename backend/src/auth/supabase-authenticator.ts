import { UnauthorizedException } from '@nestjs/common';
import { JWTVerifyGetKey, createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthConfig } from './auth-config';
import { AuthHeaders, RequestAuthenticator } from './request-authenticator';

/** Audience Supabase puts in the access tokens of signed-in users. */
const AUDIENCE = 'authenticated';

/**
 * Supabase sign-in: checks the `Authorization: Bearer <access token>` header and returns the
 * token's subject, the Supabase user id (which is also the PlateUp user id). The development
 * `x-user-id` header is ignored.
 *
 * Tokens are verified locally with the `jose` library: against the project's published signing
 * keys (fetched once and cached), or against the legacy shared secret when one is configured.
 */
export class SupabaseAuthenticator extends RequestAuthenticator {
  private readonly issuer: string;
  private readonly getKey: JWTVerifyGetKey;
  private readonly algorithms: string[];

  /**
   * @param getKey overrides where signing keys come from (tests pass a local key set).
   */
  constructor(config: AuthConfig, getKey?: JWTVerifyGetKey) {
    super();
    if (config.supabaseUrl === null) {
      throw new Error('SupabaseAuthenticator needs SUPABASE_URL.');
    }
    this.issuer = `${config.supabaseUrl}/auth/v1`;
    const secret = config.jwtSecret;
    if (getKey === undefined && secret !== null) {
      const key = new TextEncoder().encode(secret);
      this.getKey = async () => key;
      this.algorithms = ['HS256'];
    } else {
      this.getKey = getKey ?? createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
      this.algorithms = ['ES256', 'RS256'];
    }
  }

  /** @throws UnauthorizedException if the token is malformed, expired, or not from this project. */
  public async identify(headers: AuthHeaders): Promise<string | null> {
    const token = bearerToken(headers.authorization);
    if (token === null) {
      return null;
    }
    try {
      const { payload } = await jwtVerify(token, this.getKey, {
        issuer: this.issuer,
        audience: AUDIENCE,
        algorithms: this.algorithms,
      });
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new Error('Token has no subject.');
      }
      return payload.sub;
    } catch {
      // The reason (expired, bad signature, ...) stays on the server; the client just logs in again.
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }
  }
}

/** The token from an `Authorization: Bearer <token>` header, or null if there is none. */
function bearerToken(header: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? '');
  return match ? match[1] : null;
}
