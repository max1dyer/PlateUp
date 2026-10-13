import { Repository } from '../../common/persistence/repository';
import { PantryItem } from '../entities/pantry-item.entity';

/** DI token and contract for pantry storage. */
export abstract class PantryItemRepository extends Repository<PantryItem> {
  public abstract findByOwner(ownerId: string): Promise<PantryItem[]>;
}
