import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { GroceryList } from '../entities/grocery-list.entity';
import { GroceryListRepository } from './grocery-list.repository';

/** `GroceryListRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryGroceryListRepository
  extends InMemoryRepository<GroceryList>
  implements GroceryListRepository
{
  /** Every list this user owns or was given access to. */
  public findAccessibleTo(userId: string): Promise<GroceryList[]> {
    return this.findWhere((list) => list.isAccessibleTo(userId));
  }
}
