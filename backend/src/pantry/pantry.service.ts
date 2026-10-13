import { Injectable, NotFoundException } from '@nestjs/common';
import { Quantity } from '../common/domain/quantity';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryItem } from './entities/pantry-item.entity';
import { PantryItemRepository } from './repositories/pantry-item.repository';

@Injectable()
export class PantryService {
  constructor(private readonly pantryItems: PantryItemRepository) {}

  public findAll(ownerId: string): Promise<PantryItem[]> {
    return this.pantryItems.findByOwner(ownerId);
  }

  public async add(ownerId: string, dto: CreatePantryItemDto): Promise<PantryItem> {
    const quantity = new Quantity(dto.quantity.amount, dto.quantity.unit);
    return this.pantryItems.save(new PantryItem(ownerId, dto.name, quantity));
  }

  public async update(
    ownerId: string,
    itemId: string,
    dto: UpdatePantryItemDto,
  ): Promise<PantryItem> {
    const item = await this.findOwned(ownerId, itemId);
    if (dto.name !== undefined) {
      item.rename(dto.name);
    }
    if (dto.quantity !== undefined) {
      item.setQuantity(new Quantity(dto.quantity.amount, dto.quantity.unit));
    }
    return this.pantryItems.save(item);
  }

  public async remove(ownerId: string, itemId: string): Promise<void> {
    await this.findOwned(ownerId, itemId);
    await this.pantryItems.delete(itemId);
  }

  private async findOwned(ownerId: string, itemId: string): Promise<PantryItem> {
    const item = await this.pantryItems.findById(itemId);
    if (!item || !item.isOwnedBy(ownerId)) {
      throw new NotFoundException(`Pantry item ${itemId} not found.`);
    }
    return item;
  }
}
