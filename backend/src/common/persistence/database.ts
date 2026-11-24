import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';

/** The one table every Postgres repository stores its entities in. */
export const ENTITY_TABLE = 'entity_records';

/**
 * Creates the storage table if it does not exist yet, so a new, empty database (such as a fresh
 * Supabase project) needs no manual setup. Each row is one entity: `collection` names the feature
 * ("recipes", "users", ...), `data` holds the entity's `toRecord()` as JSON, and `seq` keeps the
 * order entities were first saved in.
 */
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS ${ENTITY_TABLE} (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    seq BIGSERIAL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (collection, id)
  );
`;

/** Most connections the app opens at once; well inside the free Supabase pooler's limit. */
const MAX_CONNECTIONS = 5;

/**
 * DI token and contract for a SQL database. `StorageModule` provides a `PostgresDatabase` when
 * `DATABASE_URL` is set and `null` otherwise (repositories then keep data in memory). Tests can
 * provide an in-memory Postgres in its place.
 */
export abstract class Database {
  /** Runs one parameterized SQL statement (`$1`, `$2`, ...) and returns the resulting rows. */
  public abstract query<TRow extends object>(sql: string, params?: unknown[]): Promise<TRow[]>;
}

/**
 * `Database` backed by a node-postgres connection pool. Creates the schema when the app starts and
 * closes the pool when it stops.
 */
export class PostgresDatabase extends Database implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresDatabase.name);

  /** @param pool - Connection pool; tests pass one from an in-memory Postgres. */
  constructor(private readonly pool: Pick<Pool, 'query' | 'end'>) {
    super();
  }

  /** Nest lifecycle hook: makes sure the storage table exists before any request is served. */
  public async onModuleInit(): Promise<void> {
    await this.pool.query(SCHEMA_SQL);
    this.logger.log('Connected to PostgreSQL');
  }

  /** Nest lifecycle hook: closes every open connection on shutdown. */
  public async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  public async query<TRow extends object>(sql: string, params: unknown[] = []): Promise<TRow[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as TRow[];
  }
}

/**
 * Builds the database from environment variables, or returns null when `DATABASE_URL` is not set
 * (local development and tests then use in-memory storage).
 *
 * Connections to a remote host (such as Supabase) are encrypted. The certificate chain is not
 * verified, because Supabase signs with its own certificate authority; a private demo project
 * accepts that trade-off. Put `DATABASE_URL` in without an `sslmode` parameter.
 */
export function createDatabaseFromEnv(env: NodeJS.ProcessEnv = process.env): Database | null {
  const connectionString = env.DATABASE_URL?.trim();
  if (!connectionString) {
    return null;
  }
  const config: PoolConfig = {
    connectionString,
    max: MAX_CONNECTIONS,
    ssl: isLocalDatabase(connectionString) ? false : { rejectUnauthorized: false },
  };
  return new PostgresDatabase(new Pool(config));
}

/** True for a database on this machine, which needs no encryption. */
function isLocalDatabase(connectionString: string): boolean {
  const { hostname } = new URL(connectionString);
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
}
