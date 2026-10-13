import { BaseEntity } from '../domain/base.entity';

/**
 * Storage contract for aggregate roots. Services depend on this abstraction
 * (through a feature-specific subclass used as the DI token), never on a
 * concrete store, so the in-memory implementation can later be replaced by a
 * database-backed one without touching any service code.
 */
export abstract class Repository<T extends BaseEntity<object>> {
  public abstract findAll(): Promise<T[]>;
  public abstract findById(id: string): Promise<T | null>;
  public abstract save(entity: T): Promise<T>;
  /** Returns false if nothing with that id existed. */
  public abstract delete(id: string): Promise<boolean>;
}
