import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { PantryItem } from '../entities/pantry-item.entity';
import { PantryItemRepository } from './pantry-item.repository';

@Injectable()
export class InMemoryPantryItemRepository
  extends InMemoryRepository<PantryItem>
  implements PantryItemRepository
{
  public findByOwner(ownerId: string): Promise<PantryItem[]> {
    return this.findWhere((item) => item.isOwnedBy(ownerId));
  }
}
