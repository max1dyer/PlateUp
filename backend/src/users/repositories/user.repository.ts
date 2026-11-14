import { Repository } from '../../common/persistence/repository';
import { User } from '../entities/user.entity';

/** DI token and contract for user storage. */
export abstract class UserRepository extends Repository<User> {
  /** The user with this username (case-insensitive), or null if there is none. */
  public abstract findByUsername(username: string): Promise<User | null>;
}
