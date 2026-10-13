import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { GroceryList } from '../entities/grocery-list.entity';
import { GroceryListRepository } from './grocery-list.repository';

@Injectable()
export class InMemoryGroceryListRepository
  extends InMemoryRepository<GroceryList>
  implements GroceryListRepository
{
  public findByOwner(ownerId: string): Promise<GroceryList[]> {
    return this.findWhere((list) => list.isOwnedBy(ownerId));
  }
}
