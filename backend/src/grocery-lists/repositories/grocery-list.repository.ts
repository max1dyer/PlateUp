import { Repository } from '../../common/persistence/repository';
import { GroceryList } from '../entities/grocery-list.entity';

/** DI token and contract for grocery list storage. */
export abstract class GroceryListRepository extends Repository<GroceryList> {
  public abstract findByOwner(ownerId: string): Promise<GroceryList[]>;
}
