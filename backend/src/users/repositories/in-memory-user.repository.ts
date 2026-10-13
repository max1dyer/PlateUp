import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { User } from '../entities/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class InMemoryUserRepository extends InMemoryRepository<User> implements UserRepository {
  public async findByUsername(username: string): Promise<User | null> {
    const normalized = User.normalizeUsername(username);
    const [match] = await this.findWhere((user) => user.username === normalized);
    return match ?? null;
  }
}
