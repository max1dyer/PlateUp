import { newDb } from 'pg-mem';
import { PostgresDatabase } from '../persistence/database';

/**
 * An in-memory PostgreSQL server for tests (pg-mem), so the SQL in `PostgresRepository` runs in CI
 * without a real database. `connect()` opens a new `PostgresDatabase` on the same data, which lets
 * a test stop the app and start it again to check that data survives a restart.
 */
export function createTestPostgres(): { connect(): PostgresDatabase } {
  // pg-mem cannot plan every clause of `CREATE TABLE IF NOT EXISTS` once the table exists; this
  // skips that check without changing results.
  const { Pool } = newDb({ noAstCoverageCheck: true }).adapters.createPg();
  return { connect: () => new PostgresDatabase(new Pool()) };
}
