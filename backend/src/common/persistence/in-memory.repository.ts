import { BaseEntity } from '../domain/base.entity';
import { Repository } from './repository';

/**
 * Map-backed Repository used until the team picks a database. Data is lost
 * when the server restarts.
 */
export class InMemoryRepository<T extends BaseEntity<object>> extends Repository<T> {
  /** Every stored entity, keyed by id. */
  private readonly entities = new Map<string, T>();

  /** Returns every stored entity, in insertion order. */
  public async findAll(): Promise<T[]> {
    return [...this.entities.values()];
  }

  /** Returns the entity with this id, or null if there is none. */
  public async findById(id: string): Promise<T | null> {
    return this.entities.get(id) ?? null;
  }

  /** Inserts or replaces the entity (keyed by its id) and returns it. */
  public async save(entity: T): Promise<T> {
    this.entities.set(entity.id, entity);
    return entity;
  }

  /** Removes the entity with this id. Returns false if it did not exist. */
  public async delete(id: string): Promise<boolean> {
    return this.entities.delete(id);
  }

  /** Helper for subclasses implementing feature-specific queries. */
  protected async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    return [...this.entities.values()].filter(predicate);
  }
}
