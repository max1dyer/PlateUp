import { UnauthorizedException } from '@nestjs/common';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { AuthConfig } from './auth-config';
import { DevelopmentAuthenticator } from './development-authenticator';
import { SupabaseAuthenticator } from './supabase-authenticator';
import { TEST_SUPABASE_URL, buildSupabaseConfig, signTestToken } from './testing/auth.fixtures';

describe('DevelopmentAuthenticator', () => {
  const authenticator = new DevelopmentAuthenticator();

  it('trusts the x-user-id header, ignoring whitespace', async () => {
    expect(await authenticator.identify({ userId: ' alice ' })).toBe('alice');
  });

  it('treats a missing or blank header as anonymous', async () => {
    expect(await authenticator.identify({})).toBeNull();
    expect(await authenticator.identify({ userId: '  ' })).toBeNull();
  });
});

describe('SupabaseAuthenticator', () => {
  const authenticator = new SupabaseAuthenticator(buildSupabaseConfig());
  const bearer = async (token: Promise<string>) => ({ authorization: `Bearer ${await token}` });

  it("returns the token's user id", async () => {
    expect(await authenticator.identify(await bearer(signTestToken('user-123')))).toBe('user-123');
  });

  it('treats a request without a token as anonymous, and ignores the x-user-id header', async () => {
    expect(await authenticator.identify({ userId: 'alice' })).toBeNull();
    expect(await authenticator.identify({ authorization: 'Basic abc' })).toBeNull();
  });

  it.each([
    ['expired', { exp: Math.floor(Date.now() / 1000) - 60 }],
    ['from another project', { iss: 'https://other.supabase.co/auth/v1' }],
    ['for another audience', { aud: 'anon' }],
    ['signed with another secret', { secret: 'a-different-secret-of-at-least-32-chars' }],
  ])('rejects a token %s with 401', async (_, overrides) => {
    await expect(
      authenticator.identify(await bearer(signTestToken('user-123', overrides))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a malformed token with 401', async () => {
    await expect(authenticator.identify({ authorization: 'Bearer not-a-jwt' })).rejects.toThrow(
      'Your session has expired. Please log in again.',
    );
  });

  it("checks tokens against the project's published signing keys when there is no secret", async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: 'key-1' }] });
    const config = AuthConfig.fromEnv({ SUPABASE_URL: TEST_SUPABASE_URL, SUPABASE_ANON_KEY: 'a' });
    const withKeys = new SupabaseAuthenticator(config, jwks);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setSubject('user-456')
      .setIssuer(`${TEST_SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    expect(await withKeys.identify({ authorization: `Bearer ${token}` })).toBe('user-456');
    // A shared-secret token is not accepted once the project uses signing keys.
    await expect(withKeys.identify(await bearer(signTestToken('user-456')))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
