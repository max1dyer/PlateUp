import { Injectable, NotFoundException } from '@nestjs/common';
import { requireCalendarDateOrNull } from '../common/domain/calendar-date';
import { requireOneOf, requireText } from '../common/domain/guards';
import { IngredientCategory } from '../common/domain/ingredient-category';
import { Quantity } from '../common/domain/quantity';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { CheckStockDto } from './dto/check-stock.dto';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryItem } from './entities/pantry-item.entity';
import { StockLevel, checkStock } from './entities/stock-level';
import { PantryItemRepository } from './repositories/pantry-item.repository';

/**
 * Use-case layer for the pantry: keeps one item per ingredient for each user and hides other users'
 * items (reported as 404).
 */
@Injectable()
export class PantryService {
  constructor(private readonly pantryItems: PantryItemRepository) {}

  /** Every item in the user's pantry. */
  public findAll(ownerId: string): Promise<PantryItem[]> {
    return this.pantryItems.findByOwner(ownerId);
  }

  /**
   * How much of each listed ingredient the user's pantry holds, converted to the listed unit, so a
   * recipe page can show "you have 1/2 cup of 1 cup" (issue #38).
   *
   * @throws DomainValidationError if the list is missing or a line is invalid.
   */
  public async checkStock(ownerId: string, dto: CheckStockDto): Promise<StockLevel[]> {
    if (!Array.isArray(dto.ingredients)) {
      throw new DomainValidationError('Ingredients must be a list.');
    }
    const needs = dto.ingredients.map((line) => ({
      name: requireText(line.name, 'Ingredient name'),
      quantity: new Quantity(line.quantity?.amount, line.quantity?.unit),
    }));
    return checkStock(needs, await this.findAll(ownerId));
  }

  /**
   * Adds an ingredient. A pantry holds one item per ingredient, so if the owner
   * already has it the amount is combined into that item (which is returned
   * instead, keeping the earlier expiration date and its section); an amount in a unit that
   * can't be combined is refused. With no category, the section is guessed from the name.
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
      existing.addQuantity(quantity, dto.expiresOn ?? null);
      return this.pantryItems.save(existing);
    }
    return this.pantryItems.save(
      new PantryItem(ownerId, dto.name, quantity, dto.expiresOn ?? null, dto.category),
    );
  }

  /**
   * Edits an item's name, amount, expiration date, or section. Renaming to another
   * item's ingredient is refused, to keep one item per ingredient.
   */
  public async update(
    ownerId: string,
    itemId: string,
    dto: UpdatePantryItemDto,
  ): Promise<PantryItem> {
    const item = await this.findOwned(ownerId, itemId);
    const quantity =
      dto.quantity === undefined ? undefined : new Quantity(dto.quantity.amount, dto.quantity.unit);
    // Check the date and section before changing anything, so a bad date leaves the item untouched.
    const expiresOn =
      dto.expiresOn === undefined
        ? undefined
        : requireCalendarDateOrNull(dto.expiresOn, 'Expiration date');
    const category =
      dto.category === undefined
        ? undefined
        : requireOneOf(dto.category, IngredientCategory, 'category');
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
    if (expiresOn !== undefined) {
      item.setExpiresOn(expiresOn);
    }
    if (category !== undefined) {
      item.setCategory(category);
    }
    return this.pantryItems.save(item);
  }

  /**
   * Deletes one of the user's pantry items.
   *
   * @throws NotFoundException if it does not exist or belongs to someone else.
   */
  public async remove(ownerId: string, itemId: string): Promise<void> {
    await this.findOwned(ownerId, itemId);
    await this.pantryItems.delete(itemId);
  }

  /** Loads one of the user's items, reporting other users' items as not found. */
  private async findOwned(ownerId: string, itemId: string): Promise<PantryItem> {
    const item = await this.pantryItems.findById(itemId);
    if (!item || !item.isOwnedBy(ownerId)) {
      throw new NotFoundException(`Pantry item ${itemId} not found.`);
    }
    return item;
  }

  /** The user's item for the same ingredient as `name` (case and spacing ignored), if any. */
  private async findOwnedNamed(ownerId: string, name: string): Promise<PantryItem | undefined> {
    const owned = await this.pantryItems.findByOwner(ownerId);
    return owned.find((item) => item.isNamed(name));
  }
}
