import { BaseEntity, EntityRecord } from '../domain/base.entity';
import { Repository } from './repository';

/**
 * Map-backed Repository, used for local development and tests when no `DATABASE_URL` is set. Data
 * is lost when the server restarts.
 *
 * It behaves like the PostgreSQL repository on purpose: it stores each entity's `toRecord()` (sent
 * through JSON, as a database would) and every read returns a freshly restored copy. Changing an
 * entity therefore has no effect until it is passed to `save()`, in development exactly as in
 * production, so a forgotten `save()` fails the tests instead of only losing data once deployed.
 */
export class InMemoryRepository<
  T extends BaseEntity<object>,
  TRecord extends EntityRecord,
> extends Repository<T> {
  /** Every stored entity's record, keyed by id, in the order they were first saved. */
  private readonly records = new Map<string, TRecord>();

  /** @param restore - The entity's static `fromRecord()`. */
  constructor(private readonly restore: (record: TRecord) => T) {
    super();
  }

  /** Returns a copy of every stored entity, in insertion order. */
  public async findAll(): Promise<T[]> {
    return [...this.records.values()].map((record) => this.restore(record));
  }

  /** Returns a copy of the entity with this id, or null if there is none. */
  public async findById(id: string): Promise<T | null> {
    const record = this.records.get(id);
    return record ? this.restore(record) : null;
  }

  /** Inserts or replaces the entity's record (keyed by its id) and returns the entity. */
  public async save(entity: T): Promise<T> {
    const record = JSON.parse(JSON.stringify(entity.toRecord())) as TRecord;
    this.records.set(entity.id, record);
    return entity;
  }

  /** Removes the entity with this id. Returns false if it did not exist. */
  public async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  /** Helper for subclasses implementing feature-specific queries. */
  protected async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    return (await this.findAll()).filter(predicate);
  }
}
