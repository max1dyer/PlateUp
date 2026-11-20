import { SignJWT } from 'jose';
import { AuthConfig } from '../auth-config';

/** Supabase settings for tests, using the legacy shared secret so tokens can be signed locally. */
export const TEST_SUPABASE_URL = 'https://test-project.supabase.co';
export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

/** An `AuthConfig` in Supabase mode for tests. */
export function buildSupabaseConfig(): AuthConfig {
  return AuthConfig.fromEnv({
    SUPABASE_URL: TEST_SUPABASE_URL,
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_JWT_SECRET: TEST_JWT_SECRET,
  });
}

/**
 * A Supabase-style access token for `userId`, signed with the test secret. `overrides` change the
 * claims, e.g. `{ exp: 0 }` for an expired token.
 */
export function signTestToken(
  userId: string,
  overrides: { iss?: string; aud?: string; exp?: number; secret?: string } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(overrides.iss ?? `${TEST_SUPABASE_URL}/auth/v1`)
    .setAudience(overrides.aud ?? 'authenticated')
    .setIssuedAt(now)
    .setExpirationTime(overrides.exp ?? now + 3600)
    .sign(new TextEncoder().encode(overrides.secret ?? TEST_JWT_SECRET));
}
