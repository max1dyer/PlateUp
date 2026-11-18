import { Repository } from '../../common/persistence/repository';
import { GroceryList } from '../entities/grocery-list.entity';

/** DI token and contract for grocery list storage. */
export abstract class GroceryListRepository extends Repository<GroceryList> {
  /** Every list this user owns or was given access to. */
  public abstract findAccessibleTo(userId: string): Promise<GroceryList[]>;
}
