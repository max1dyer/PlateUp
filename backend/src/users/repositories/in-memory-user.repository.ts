import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { User } from '../entities/user.entity';
import { UserRepository } from './user.repository';

/** `UserRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryUserRepository extends InMemoryRepository<User> implements UserRepository {
  /**
   * Matches usernames case-insensitively by normalizing the input the same way usernames are
   * stored.
   */
  public async findByUsername(username: string): Promise<User | null> {
    const normalized = User.normalizeUsername(username);
    const [match] = await this.findWhere((user) => user.username === normalized);
    return match ?? null;
  }
}
