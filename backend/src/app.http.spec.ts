import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { USER_ID_HEADER } from './common/decorators/current-user-id.decorator';
import { buildCreateRecipeDto } from './recipes/testing/recipe.fixtures';

interface JsonResponse {
  status: number;
  body: Record<string, unknown> & Record<string, unknown>[];
}

/**
 * Interface tests: the whole app (controllers, services, in-memory
 * repositories, and the domain error filter) driven over real HTTP, covering
 * the pantry and recipe CRUD paths end to end.
 */
describe('PlateUp HTTP API', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(() => app.close());

  async function call(
    method: string,
    path: string,
    userId: string | null,
    body?: unknown,
  ): Promise<JsonResponse> {
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
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  describe('pantry CRUD', () => {
    it('adds, lists, edits, and removes an item for its owner only', async () => {
      const created = await call('POST', '/pantry', 'alice', {
        name: 'Eggs',
        quantity: { amount: 12, unit: 'piece' },
      });
      expect(created.status).toBe(201);
      const itemId = created.body.id as string;

      const listed = await call('GET', '/pantry', 'alice');
      expect(listed.body.map((item) => item.name)).toEqual(['Eggs']);
      expect((await call('GET', '/pantry', 'bob')).body).toEqual([]);

      const edited = await call('PATCH', `/pantry/${itemId}`, 'alice', {
        quantity: { amount: 6, unit: 'piece' },
      });
      expect(edited.status).toBe(200);
      expect(edited.body.quantity).toEqual({ amount: 6, unit: 'piece' });

      expect((await call('DELETE', `/pantry/${itemId}`, 'bob')).status).toBe(404);
      expect((await call('DELETE', `/pantry/${itemId}`, 'alice')).status).toBe(204);
      expect((await call('GET', '/pantry', 'alice')).body).toEqual([]);
    });

    it('answers 400 with a message for invalid input', async () => {
      const response = await call('POST', '/pantry', 'alice', {
        name: ' ',
        quantity: { amount: 1, unit: 'piece' },
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Pantry item name is required.');
    });

    it('answers 401 without a user', async () => {
      expect((await call('GET', '/pantry', null)).status).toBe(401);
    });
  });

  describe('recipe CRUD', () => {
    it('creates, reads, updates, and deletes a recipe', async () => {
      const created = await call('POST', '/recipes', 'alice', buildCreateRecipeDto());
      expect(created.status).toBe(201);
      const recipeId = created.body.id as string;

      const read = await call('GET', `/recipes/${recipeId}`, 'bob');
      expect(read.body).toMatchObject({ title: 'Chicken and Rice', authorId: 'alice' });

      const updated = await call('PATCH', `/recipes/${recipeId}`, 'alice', { servings: 4 });
      expect(updated.body.servings).toBe(4);
      expect((await call('PATCH', `/recipes/${recipeId}`, 'bob', { servings: 1 })).status).toBe(
        403,
      );

      expect((await call('DELETE', `/recipes/${recipeId}`, 'alice')).status).toBe(204);
      expect((await call('GET', `/recipes/${recipeId}`, 'alice')).status).toBe(404);
    });

    it('hides a private recipe from everyone but its author', async () => {
      const created = await call(
        'POST',
        '/recipes',
        'alice',
        buildCreateRecipeDto({ title: 'Secret', visibility: 'private' as never }),
      );
      const recipeId = created.body.id as string;

      expect((await call('GET', `/recipes/${recipeId}`, 'bob')).status).toBe(404);
      const bobsFeed = await call('GET', '/recipes', 'bob');
      expect(bobsFeed.body.some((recipe) => recipe.id === recipeId)).toBe(false);
    });

    it('rejects a recipe without ingredients', async () => {
      const response = await call(
        'POST',
        '/recipes',
        'alice',
        buildCreateRecipeDto({ ingredients: [] }),
      );

      expect(response.status).toBe(400);
    });
  });

  describe('user flow', () => {
    it('registers, logs in, saves a recipe, and generates a grocery list from it', async () => {
      const registered = await call('POST', '/users', null, {
        username: 'casey',
        displayName: 'Casey',
      });
      expect(registered.status).toBe(201);
      const loggedIn = await call('POST', '/users/login', null, { username: 'Casey' });
      expect(loggedIn.status).toBe(200);
      const userId = loggedIn.body.id as string;

      const recipe = await call('POST', '/recipes', 'chef', buildCreateRecipeDto());
      const recipeId = recipe.body.id as string;
      await call('PUT', `/users/me/saved-recipes/${recipeId}`, userId);
      const saved = await call('GET', '/users/me/saved-recipes', userId);
      expect(saved.body.map((r) => r.id)).toEqual([recipeId]);

      const list = await call('POST', '/grocery-lists', userId, { name: 'This week' });
      const generated = await call('POST', `/grocery-lists/${list.body.id}/recipes`, userId, {
        recipeId,
        servings: 4,
      });
      expect(generated.status).toBe(201);
      expect(generated.body.items).toEqual([
        expect.objectContaining({ name: 'Chicken breast', quantity: { amount: 800, unit: 'g' } }),
        expect.objectContaining({ name: 'Rice', quantity: { amount: 2, unit: 'cup' } }),
      ]);
    });
  });
});
