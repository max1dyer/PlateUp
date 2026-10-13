import { BaseEntity } from '../domain/base.entity';
import { Repository } from './repository';

/**
 * Map-backed Repository used until the team picks a database. Data is lost
 * when the server restarts.
 */
export class InMemoryRepository<T extends BaseEntity<object>> extends Repository<T> {
  private readonly entities = new Map<string, T>();

  public async findAll(): Promise<T[]> {
    return [...this.entities.values()];
  }

  public async findById(id: string): Promise<T | null> {
    return this.entities.get(id) ?? null;
  }

  public async save(entity: T): Promise<T> {
    this.entities.set(entity.id, entity);
    return entity;
  }

  public async delete(id: string): Promise<boolean> {
    return this.entities.delete(id);
  }

  /** Helper for subclasses implementing feature-specific queries. */
  protected async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    return [...this.entities.values()].filter(predicate);
  }
}
