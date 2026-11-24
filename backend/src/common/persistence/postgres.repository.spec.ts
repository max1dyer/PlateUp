import { IngredientCategory } from '../domain/ingredient-category';
import { Quantity, Unit } from '../domain/quantity';
import { PantryItem } from '../../pantry/entities/pantry-item.entity';
import { PostgresPantryItemRepository } from '../../pantry/repositories/postgres-pantry-item.repository';
import { PostgresRecipeRepository } from '../../recipes/repositories/postgres-recipe.repository';
import { createTestPostgres } from '../testing/test-database';
import { asJson } from '../testing/store-and-restore';
import { createDatabaseFromEnv, PostgresDatabase } from './database';

/**
 * `PostgresRepository` against an in-memory PostgreSQL (pg-mem), through the pantry repository:
 * the SQL for saving, loading, replacing, deleting, and querying.
 */
describe('PostgresRepository', () => {
  let database: PostgresDatabase;
  let pantry: PostgresPantryItemRepository;
  const eggs = () => new PantryItem('alice', 'Eggs', new Quantity(12, Unit.Piece));

  beforeEach(async () => {
    database = createTestPostgres().connect();
    await database.onModuleInit();
    pantry = new PostgresPantryItemRepository(database);
  });

  afterEach(() => database.onModuleDestroy());

  it('saves an entity and loads an equal copy by id', async () => {
    const item = eggs();
    await pantry.save(item);

    const loaded = await pantry.findById(item.id);

    expect(loaded).not.toBe(item);
    expect(asJson(loaded)).toEqual(asJson(item));
    expect(await pantry.findById('missing')).toBeNull();
  });

  it('replaces the stored row on a second save and keeps the original order', async () => {
    const first = eggs();
    const second = new PantryItem('alice', 'Milk', new Quantity(1, Unit.Liter));
    await pantry.save(first);
    await pantry.save(second);

    first.setCategory(IngredientCategory.Dairy);
    await pantry.save(first);

    const all = await pantry.findAll();
    expect(all.map((item) => item.name)).toEqual(['Eggs', 'Milk']);
    expect(all[0].category).toBe(IngredientCategory.Dairy);
    expect(all[0].updatedAt).toEqual(first.updatedAt);
  });

  it('runs feature queries with the entity rules', async () => {
    await pantry.save(eggs());
    await pantry.save(new PantryItem('bob', 'Rice', new Quantity(1, Unit.Kilogram)));

    expect((await pantry.findByOwner('bob')).map((item) => item.name)).toEqual(['Rice']);
  });

  it('deletes by id and reports whether anything was there', async () => {
    const item = eggs();
    await pantry.save(item);

    expect(await pantry.delete(item.id)).toBe(true);
    expect(await pantry.delete(item.id)).toBe(false);
    expect(await pantry.findAll()).toEqual([]);
  });

  it('keeps each feature in its own collection', async () => {
    await pantry.save(eggs());

    expect(await new PostgresRecipeRepository(database).findAll()).toEqual([]);
  });

  it('can create the schema again on an existing database', async () => {
    await pantry.save(eggs());

    await database.onModuleInit();

    expect(await pantry.findAll()).toHaveLength(1);
  });
});

describe('createDatabaseFromEnv', () => {
  it('returns no database without DATABASE_URL, so storage stays in memory', () => {
    expect(createDatabaseFromEnv({})).toBeNull();
    expect(createDatabaseFromEnv({ DATABASE_URL: '  ' })).toBeNull();
  });

  it('builds a PostgreSQL connection pool when DATABASE_URL is set', async () => {
    const database = createDatabaseFromEnv({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db' });

    expect(database).toBeInstanceOf(PostgresDatabase);
    await (database as PostgresDatabase).onModuleDestroy();
  });
});
