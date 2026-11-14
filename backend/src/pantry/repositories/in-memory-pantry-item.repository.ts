import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { PantryItem } from '../entities/pantry-item.entity';
import { PantryItemRepository } from './pantry-item.repository';

/** `PantryItemRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryPantryItemRepository
  extends InMemoryRepository<PantryItem>
  implements PantryItemRepository
{
  /** Every pantry item owned by this user. */
  public findByOwner(ownerId: string): Promise<PantryItem[]> {
    return this.findWhere((item) => item.isOwnedBy(ownerId));
  }
}
