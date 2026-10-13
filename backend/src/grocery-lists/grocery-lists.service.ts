import { Injectable, NotFoundException } from '@nestjs/common';
import { Quantity } from '../common/domain/quantity';
import { AddGroceryItemDto } from './dto/add-grocery-item.dto';
import { CreateGroceryListDto } from './dto/create-grocery-list.dto';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto';
import { GroceryList } from './entities/grocery-list.entity';
import { GroceryListRepository } from './repositories/grocery-list.repository';

@Injectable()
export class GroceryListsService {
  constructor(private readonly groceryLists: GroceryListRepository) {}

  public findAll(ownerId: string): Promise<GroceryList[]> {
    return this.groceryLists.findByOwner(ownerId);
  }

  public async findOne(ownerId: string, listId: string): Promise<GroceryList> {
    const list = await this.groceryLists.findById(listId);
    if (!list || !list.isOwnedBy(ownerId)) {
      throw new NotFoundException(`Grocery list ${listId} not found.`);
    }
    return list;
  }

  public async create(ownerId: string, dto: CreateGroceryListDto): Promise<GroceryList> {
    return this.groceryLists.save(new GroceryList(ownerId, dto.name));
  }

  public async rename(
    ownerId: string,
    listId: string,
    dto: UpdateGroceryListDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    list.rename(dto.name);
    return this.groceryLists.save(list);
  }

  public async remove(ownerId: string, listId: string): Promise<void> {
    await this.findOne(ownerId, listId);
    await this.groceryLists.delete(listId);
  }

  public async addItem(
    ownerId: string,
    listId: string,
    dto: AddGroceryItemDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    const quantity = dto.quantity ? new Quantity(dto.quantity.amount, dto.quantity.unit) : null;
    list.addItem(dto.name, quantity);
    return this.groceryLists.save(list);
  }

  public async updateItem(
    ownerId: string,
    listId: string,
    itemId: string,
    dto: UpdateGroceryItemDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    if (!list.setItemPurchased(itemId, dto.purchased === true)) {
      throw this.itemNotFound(itemId);
    }
    return this.groceryLists.save(list);
  }

  public async removeItem(ownerId: string, listId: string, itemId: string): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    if (!list.removeItem(itemId)) {
      throw this.itemNotFound(itemId);
    }
    return this.groceryLists.save(list);
  }

  public async removePurchasedItems(ownerId: string, listId: string): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    list.removePurchasedItems();
    return this.groceryLists.save(list);
  }

  private itemNotFound(itemId: string): NotFoundException {
    return new NotFoundException(`Grocery item ${itemId} not found.`);
  }
}
