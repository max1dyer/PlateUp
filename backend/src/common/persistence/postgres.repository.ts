import { BaseEntity, EntityRecord } from '../domain/base.entity';
import { Database, ENTITY_TABLE } from './database';
import { Repository } from './repository';

/** One stored row, as `PostgresRepository` reads it back. */
interface EntityRow<TRecord extends EntityRecord> {
  data: TRecord;
}

/**
 * `Repository` backed by PostgreSQL. Every entity is one row in `entity_records`: its
 * `toRecord()` goes into a JSONB column on save, and the entity's static `fromRecord()` rebuilds it
 * on load, so entities keep their fields private and the domain layer stays free of SQL.
 *
 * Each feature subclasses this (e.g. `PostgresRecipeRepository`) to name its collection and add its
 * queries. Queries use `findWhere()` with the entity's own rule (`isVisibleTo`, `isOwnedBy`, ...),
 * exactly like the in-memory repositories, so both always agree. That loads the collection and
 * filters it in the app, which is fine for a class demo's data; per-query SQL could replace it
 * later without changing any service.
 */
export abstract class PostgresRepository<
  T extends BaseEntity<object>,
  TRecord extends EntityRecord,
> extends Repository<T> {
  /**
   * @param database - Where rows are stored.
   * @param collection - This feature's name in the `collection` column, e.g. "recipes".
   * @param restore - The entity's static `fromRecord()`.
   */
  protected constructor(
    private readonly database: Database,
    private readonly collection: string,
    private readonly restore: (record: TRecord) => T,
  ) {
    super();
  }

  /** Every stored entity, in the order they were first saved. */
  public async findAll(): Promise<T[]> {
    const rows = await this.database.query<EntityRow<TRecord>>(
      `SELECT data FROM ${ENTITY_TABLE} WHERE collection = $1 ORDER BY seq`,
      [this.collection],
    );
    return rows.map((row) => this.restore(row.data));
  }

  public async findById(id: string): Promise<T | null> {
    const [row] = await this.database.query<EntityRow<TRecord>>(
      `SELECT data FROM ${ENTITY_TABLE} WHERE collection = $1 AND id = $2`,
      [this.collection, id],
    );
    return row ? this.restore(row.data) : null;
  }

  /** Inserts the entity, or replaces the stored row with the same id (keeping its position). */
  public async save(entity: T): Promise<T> {
    const record = entity.toRecord();
    await this.database.query(
      `INSERT INTO ${ENTITY_TABLE} (collection, id, data, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (collection, id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [this.collection, record.id, JSON.stringify(record), record.createdAt, record.updatedAt],
    );
    return entity;
  }

  public async delete(id: string): Promise<boolean> {
    const deleted = await this.database.query(
      `DELETE FROM ${ENTITY_TABLE} WHERE collection = $1 AND id = $2 RETURNING id`,
      [this.collection, id],
    );
    return deleted.length > 0;
  }

  /** Helper for subclasses implementing feature-specific queries (same as the in-memory one). */
  protected async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    return (await this.findAll()).filter(predicate);
  }
}
