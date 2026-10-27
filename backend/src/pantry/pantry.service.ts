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

  /**
   * Adds an ingredient, or adds the amount to a matching item the owner already
   * has (same ingredient, compatible units) and returns that item instead.
   */
  public async add(ownerId: string, dto: CreatePantryItemDto): Promise<PantryItem> {
    const quantity = new Quantity(dto.quantity.amount, dto.quantity.unit);
    const owned = await this.pantryItems.findByOwner(ownerId);
    const existing = owned.find((item) => item.canCombineWith(dto.name, quantity));
    if (existing) {
      existing.addQuantity(quantity);
      return this.pantryItems.save(existing);
    }
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
