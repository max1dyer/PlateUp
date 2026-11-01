import { Injectable, NotFoundException } from '@nestjs/common';
import { Quantity } from '../common/domain/quantity';
import { DomainValidationError } from '../common/errors/domain-validation.error';
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
   * Adds an ingredient. A pantry holds one item per ingredient, so if the owner
   * already has it the amount is combined into that item (which is returned
   * instead); an amount in a unit that can't be combined is refused.
   */
  public async add(ownerId: string, dto: CreatePantryItemDto): Promise<PantryItem> {
    const quantity = new Quantity(dto.quantity.amount, dto.quantity.unit);
    const existing = await this.findOwnedNamed(ownerId, dto.name);
    if (existing) {
      if (!existing.canAddQuantity(quantity)) {
        throw new DomainValidationError(
          `${existing.name} is already in your pantry in ${existing.quantity.unit}. ` +
            'Add it in a compatible unit, or edit the existing item.',
        );
      }
      existing.addQuantity(quantity);
      return this.pantryItems.save(existing);
    }
    return this.pantryItems.save(new PantryItem(ownerId, dto.name, quantity));
  }

  /** Renaming to another item's ingredient is refused, to keep one item per ingredient. */
  public async update(
    ownerId: string,
    itemId: string,
    dto: UpdatePantryItemDto,
  ): Promise<PantryItem> {
    const item = await this.findOwned(ownerId, itemId);
    const quantity =
      dto.quantity === undefined ? undefined : new Quantity(dto.quantity.amount, dto.quantity.unit);
    if (dto.name !== undefined) {
      const other = await this.findOwnedNamed(ownerId, dto.name);
      if (other && other.id !== item.id) {
        throw new DomainValidationError(
          `${other.name} is already in your pantry. Edit that item instead.`,
        );
      }
      item.rename(dto.name);
    }
    if (quantity !== undefined) {
      item.setQuantity(quantity);
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

  private async findOwnedNamed(ownerId: string, name: string): Promise<PantryItem | undefined> {
    const owned = await this.pantryItems.findByOwner(ownerId);
    return owned.find((item) => item.isNamed(name));
  }
}
