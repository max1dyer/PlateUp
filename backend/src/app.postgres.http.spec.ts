import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { USER_ID_HEADER } from './common/decorators/current-user-id.decorator';
import { Database } from './common/persistence/database';
import { createTestPostgres } from './common/testing/test-database';
import { buildCreateRecipeDto } from './recipes/testing/recipe.fixtures';

type Json = Record<string, unknown> & Record<string, unknown>[];

/**
 * Interface tests with PostgreSQL storage: the whole app runs on an in-memory PostgreSQL (pg-mem)
 * in place of the `DATABASE_URL` connection, is stopped, and is started again on the same data,
 * the way a free host restarts it after it sleeps.
 */
describe('PlateUp HTTP API with PostgreSQL storage', () => {
  const postgres = createTestPostgres();
  let app: INestApplication;
  let baseUrl: string;

  async function start(): Promise<void> {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Database)
      .useValue(postgres.connect())
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    baseUrl = await app.getUrl();
  }

  async function call(method: string, path: string, userId: string | null, body?: unknown) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (userId) {
      headers[USER_ID_HEADER] = userId;
    }
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: (text ? JSON.parse(text) : null) as Json };
  }

  afterAll(() => app.close());

  it('keeps users, recipes, saved recipes, pantry items, and grocery lists across a restart', async () => {
    await start();
    const registered = await call('POST', '/users', null, {
      username: 'casey',
      displayName: 'Casey',
    });
    const userId = registered.body.id as string;
    const recipe = await call('POST', '/recipes', userId, buildCreateRecipeDto());
    const recipeId = recipe.body.id as string;
    await call('PUT', `/users/me/saved-recipes/${recipeId}`, userId);
    await call('POST', '/pantry', userId, {
      name: 'Eggs',
      quantity: { amount: 12, unit: 'piece' },
    });
    const list = await call('POST', '/grocery-lists', userId, { name: 'This week' });
    const listId = list.body.id as string;
    await call('POST', `/grocery-lists/${listId}/recipes`, userId, { recipeId, servings: 4 });
    const items = (await call('GET', `/grocery-lists/${listId}`, userId)).body.items as Json;
    const rice = items.find((item) => item.name === 'Rice');
    await call('PATCH', `/grocery-lists/${listId}/items/${rice?.id as string}`, userId, {
      purchased: true,
    });
    const before = await call('GET', `/grocery-lists/${listId}`, userId);
    expect((before.body.items as Json).map((item) => [item.name, item.purchased])).toEqual([
      ['Chicken breast', false],
      ['Rice', true],
    ]);

    await app.close();
    await start();

    const loggedIn = await call('POST', '/users/login', null, { username: 'casey' });
    expect(loggedIn.body.id).toBe(userId);
    const saved = await call('GET', '/users/me/saved-recipes', userId);
    expect(saved.body.map((r) => r.id)).toEqual([recipeId]);
    const pantry = await call('GET', '/pantry', userId);
    expect(pantry.body.map((item) => item.name)).toEqual(['Eggs']);
    const after = await call('GET', `/grocery-lists/${listId}`, userId);
    expect(after.body).toEqual(before.body);
  });

  it('adds the demo recipes only once across restarts', async () => {
    const feed = await call('GET', '/recipes', 'visitor');
    const demoRecipes = feed.body.filter((r) => r.title !== 'Chicken and Rice');

    expect(demoRecipes).toHaveLength(3);
  });
});
