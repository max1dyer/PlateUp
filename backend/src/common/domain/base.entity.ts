import { randomUUID } from 'crypto';

/** Fields every entity exposes when serialized to JSON. */
export interface EntityJson {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Root of every domain entity: gives each one an identity and timestamps.
 *
 * Entities keep their state private and expose it through methods, so
 * serialization uses the Template Method pattern: `toJSON()` (called by
 * Nest via JSON.stringify) adds the shared fields and asks the subclass for
 * the rest through `snapshot()`.
 */
export abstract class BaseEntity<TSnapshot extends object> {
  public readonly id: string;
  public readonly createdAt: Date;
  private lastUpdatedAt: Date;

  protected constructor() {
    this.id = randomUUID();
    this.createdAt = new Date();
    this.lastUpdatedAt = this.createdAt;
  }

  public get updatedAt(): Date {
    return this.lastUpdatedAt;
  }

  public toJSON(): EntityJson & TSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.lastUpdatedAt.toISOString(),
      ...this.snapshot(),
    };
  }

  /** Subclasses call this after any change to their own state. */
  protected touch(): void {
    this.lastUpdatedAt = new Date();
  }

  /** The subclass-specific fields to include in `toJSON()`. */
  protected abstract snapshot(): TSnapshot;
}
