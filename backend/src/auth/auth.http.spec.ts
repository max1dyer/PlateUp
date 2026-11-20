import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { USER_ID_HEADER } from '../common/decorators/current-user-id.decorator';
import { AuthConfig } from './auth-config';
import { buildSupabaseConfig, signTestToken } from './testing/auth.fixtures';

/**
 * Interface tests for Supabase sign-in: the whole app over real HTTP, with `AuthConfig` replaced
 * by Supabase settings whose tokens the tests can sign.
 */
describe('Supabase sign-in over HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthConfig)
      .useValue(buildSupabaseConfig())
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(() => app.close());

  async function call(
    method: string,
    path: string,
    headers: Record<string, string> = {},
    body?: unknown,
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  const as = async (userId: string) => ({ authorization: `Bearer ${await signTestToken(userId)}` });

  it('tells the frontend to use Supabase, without the secret', async () => {
    expect((await call('GET', '/auth/config')).body).toEqual({
      provider: 'supabase',
      supabaseUrl: 'https://test-project.supabase.co',
      supabaseAnonKey: 'test-anon-key',
    });
  });

  it('creates a profile keyed by the Supabase user id, then serves it', async () => {
    const headers = await as('supabase-user-1');

    expect((await call('GET', '/users/me', headers)).status).toBe(404);
    const created = await call('POST', '/users/me', headers, {
      username: 'jordan',
      displayName: 'Jordan',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: 'supabase-user-1', username: 'jordan' });
    expect((await call('GET', '/users/me', headers)).body).toMatchObject({ username: 'jordan' });
    expect(
      (await call('POST', '/users/me', headers, { username: 'jordan2', displayName: 'J' })).status,
    ).toBe(409);
  });

  it('keeps each user’s data apart by token', async () => {
    const item = { name: 'Eggs', quantity: { amount: 12, unit: 'piece' } };
    expect((await call('POST', '/pantry', await as('owner'), item)).status).toBe(201);

    expect((await call('GET', '/pantry', await as('owner'))).body).toHaveLength(1);
    expect((await call('GET', '/pantry', await as('someone-else'))).body).toEqual([]);
  });

  it('ignores the development header and refuses invalid tokens', async () => {
    expect((await call('GET', '/pantry', { [USER_ID_HEADER]: 'owner' })).status).toBe(401);
    expect((await call('GET', '/pantry', { authorization: 'Bearer forged' })).status).toBe(401);
  });

  it('turns off the username-only sign-up and log-in', async () => {
    const body = { username: 'mallory', displayName: 'Mallory' };

    expect((await call('POST', '/users', {}, body)).status).toBe(403);
    expect((await call('POST', '/users/login', {}, body)).status).toBe(403);
  });
});
