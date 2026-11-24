import { Abstract, FactoryProvider, Module } from '@nestjs/common';
import { createDatabaseFromEnv, Database } from './database';

/**
 * Provides the `Database` token: a PostgreSQL connection when `DATABASE_URL` is set, otherwise
 * `null`. Every feature module imports this and binds its repository with `repositoryProvider`.
 */
@Module({
  providers: [{ provide: Database, useFactory: () => createDatabaseFromEnv() }],
  exports: [Database],
})
export class StorageModule {}

/**
 * Binds a feature's abstract repository (the DI token services inject) to the PostgreSQL
 * implementation when there is a database, or to the in-memory one when there is not. Services
 * never know which one they got.
 *
 * @pattern Strategy — the storage implementation is chosen at startup from configuration.
 */
export function repositoryProvider<T>(
  token: Abstract<T>,
  inMemory: new () => T,
  postgres: new (database: Database) => T,
): FactoryProvider<T> {
  return {
    provide: token,
    inject: [Database],
    useFactory: (database: Database | null) => (database ? new postgres(database) : new inMemory()),
  };
}
