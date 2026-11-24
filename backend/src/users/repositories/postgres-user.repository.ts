import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { User, UserRecord } from '../entities/user.entity';
import { UserRepository } from './user.repository';

/** `UserRepository` backed by PostgreSQL (the "users" collection in `entity_records`). */
@Injectable()
export class PostgresUserRepository
  extends PostgresRepository<User, UserRecord>
  implements UserRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'users', (record) => User.fromRecord(record));
  }

  /** Matches case-insensitively, normalizing the input the same way usernames are stored. */
  public async findByUsername(username: string): Promise<User | null> {
    const normalized = User.normalizeUsername(username);
    const [match] = await this.findWhere((user) => user.username === normalized);
    return match ?? null;
  }
}
