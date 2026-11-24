import { randomUUID } from 'crypto';
import { DomainValidationError } from '../errors/domain-validation.error';
import { requireText } from './guards';

/** Fields every entity exposes when serialized to JSON. */
export interface EntityJson {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The identity part of every entity's stored record (see `toRecord()`). Timestamps are ISO strings
 * so a record survives `JSON.stringify` and a database JSON column unchanged.
 */
export type EntityRecord = EntityJson;

/**
 * Root of every domain entity: gives each one an identity and timestamps.
 *
 * Entities keep their state private and expose it through methods, so
 * serialization uses the Template Method pattern: `toJSON()` (called by
 * Nest via JSON.stringify) adds the shared fields and asks the subclass for
 * the rest through `snapshot()`.
 *
 * Storage uses a second, separate view. `toJSON()` is the public API shape: it adds computed fields
 * (ratings, costs) and leaves out private state (who a recipe is shared with, a user's
 * preferences). `toRecord()` is the complete, plain-data state a repository stores, and each
 * entity's static `fromRecord()` rebuilds an equal entity from it, keeping the same id and
 * timestamps.
 *
 * @pattern Template Method — `toJSON()` is the template method; `snapshot()`
 *   is the primitive operation each entity implements.
 * @pattern Memento — `toRecord()` captures an entity's full private state without exposing it to
 *   callers as live fields; `fromRecord()` restores it.
 */
export abstract class BaseEntity<TSnapshot extends object> {
  private entityId: string;
  private createdTime: Date;
  private lastUpdatedAt: Date;

  /** Gives the new entity a random UUID and stamps its creation time. */
  protected constructor() {
    this.entityId = randomUUID();
    this.createdTime = new Date();
    this.lastUpdatedAt = this.createdTime;
  }

  /** This entity's unique id; it never changes, even when the entity is stored and restored. */
  public get id(): string {
    return this.entityId;
  }

  /** When this entity was first created. */
  public get createdAt(): Date {
    return this.createdTime;
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
      createdAt: this.createdTime.toISOString(),
      updatedAt: this.lastUpdatedAt.toISOString(),
      ...this.snapshot(),
    };
  }

  /**
   * The entity's complete state as plain JSON-safe data, for a repository to store. The subclass's
   * static `fromRecord()` turns it back into an equal entity.
   */
  public abstract toRecord(): EntityRecord;

  /** Subclasses call this after any change to their own state. */
  protected touch(): void {
    this.lastUpdatedAt = new Date();
  }

  /** The subclass-specific fields to include in `toJSON()`. */
  protected abstract snapshot(): TSnapshot;

  /** The identity fields, for a subclass to spread into its `toRecord()` result. */
  protected identityRecord(): EntityRecord {
    return {
      id: this.entityId,
      createdAt: this.createdTime.toISOString(),
      updatedAt: this.lastUpdatedAt.toISOString(),
    };
  }

  /**
   * Gives a freshly built entity the stored id and timestamps. A subclass's `fromRecord()` calls
   * this last, after restoring its own fields, so no restore step counts as a new change.
   */
  protected restoreIdentity(record: EntityRecord): this {
    this.entityId = requireText(record.id, 'Stored id');
    this.createdTime = BaseEntity.parseTimestamp(record.createdAt, 'createdAt');
    this.lastUpdatedAt = BaseEntity.parseTimestamp(record.updatedAt, 'updatedAt');
    return this;
  }

  /** Parses a stored ISO timestamp, rejecting anything that is not a valid date. */
  private static parseTimestamp(value: string, field: string): Date {
    const date = new Date(value);
    if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
      throw new DomainValidationError(`Stored ${field} "${String(value)}" is not a valid date.`);
    }
    return date;
  }
}
