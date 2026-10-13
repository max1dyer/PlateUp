import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { AddGroceryItemDto } from './dto/add-grocery-item.dto';
import { CreateGroceryListDto } from './dto/create-grocery-list.dto';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto';
import { GroceryList } from './entities/grocery-list.entity';
import { GroceryListsService } from './grocery-lists.service';

@Controller('grocery-lists')
export class GroceryListsController {
  constructor(private readonly groceryListsService: GroceryListsService) {}

  @Get()
  public findAll(@CurrentUserId() userId: string): Promise<GroceryList[]> {
    return this.groceryListsService.findAll(userId);
  }

  @Get(':listId')
  public findOne(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.findOne(userId, listId);
  }

  @Post()
  public create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateGroceryListDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.create(userId, dto);
  }

  @Patch(':listId')
  public rename(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Body() dto: UpdateGroceryListDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.rename(userId, listId, dto);
  }

  @Delete(':listId')
  @HttpCode(204)
  public remove(@CurrentUserId() userId: string, @Param('listId') listId: string): Promise<void> {
    return this.groceryListsService.remove(userId, listId);
  }

  @Post(':listId/items')
  public addItem(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Body() dto: AddGroceryItemDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.addItem(userId, listId, dto);
  }

  @Patch(':listId/items/:itemId')
  public updateItem(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGroceryItemDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.updateItem(userId, listId, itemId, dto);
  }

  @Delete(':listId/items/:itemId')
  public removeItem(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.removeItem(userId, listId, itemId);
  }

  @Delete(':listId/purchased-items')
  public removePurchasedItems(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.removePurchasedItems(userId, listId);
  }
}
