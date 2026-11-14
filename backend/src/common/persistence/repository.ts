import { BaseEntity } from '../domain/base.entity';

/**
 * Storage contract for aggregate roots. Services depend on this abstraction
 * (through a feature-specific subclass used as the DI token), never on a
 * concrete store, so the in-memory implementation can later be replaced by a
 * database-backed one without touching any service code.
 *
 * @pattern Dependency Injection — feature subclasses of this class are the
 *   injection tokens; each module binds a concrete implementation.
 */
export abstract class Repository<T extends BaseEntity<object>> {
  /** Every stored entity. */
  public abstract findAll(): Promise<T[]>;
  /** The entity with this id, or null if there is none. */
  public abstract findById(id: string): Promise<T | null>;
  /** Inserts a new entity or replaces the stored one with the same id. */
  public abstract save(entity: T): Promise<T>;
  /** Returns false if nothing with that id existed. */
  public abstract delete(id: string): Promise<boolean>;
}
