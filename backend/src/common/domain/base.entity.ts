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
 *
 * @pattern Template Method — `toJSON()` is the template method; `snapshot()`
 *   is the primitive operation each entity implements.
 */
export abstract class BaseEntity<TSnapshot extends object> {
  public readonly id: string;
  public readonly createdAt: Date;
  private lastUpdatedAt: Date;

  /** Gives the new entity a random UUID and stamps its creation time. */
  protected constructor() {
    this.id = randomUUID();
    this.createdAt = new Date();
    this.lastUpdatedAt = this.createdAt;
  }

  /** When this entity last changed (equal to `createdAt` until the first change). */
  public get updatedAt(): Date {
    return this.lastUpdatedAt;
  }

  /**
   * Template method: called by `JSON.stringify` (and so by Nest when a controller returns an
   * entity). Merges the shared identity fields with the subclass's `snapshot()`.
   */
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
