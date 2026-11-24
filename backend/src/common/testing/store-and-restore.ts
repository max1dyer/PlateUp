import { EntityRecord } from '../domain/base.entity';

/**
 * Test helper: does what a database repository will do with an entity. It takes the entity's
 * `toRecord()`, sends it through JSON (as a database JSON column would), and rebuilds it with
 * `fromRecord`.
 */
export function storeAndRestore<TRecord extends EntityRecord, TEntity>(
  entity: { toRecord(): TRecord },
  fromRecord: (record: TRecord) => TEntity,
): TEntity {
  const stored = JSON.parse(JSON.stringify(entity.toRecord())) as TRecord;
  return fromRecord(stored);
}

/** The JSON a client would receive for `value`, for comparing an entity with its restored copy. */
export function asJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}
