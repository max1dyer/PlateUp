import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { AddGroceryItemDto } from './dto/add-grocery-item.dto';
import { AddRecipeToListDto } from './dto/add-recipe-to-list.dto';
import { CreateGroceryListDto } from './dto/create-grocery-list.dto';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto';
import { MoveToPantryResult } from './dto/move-to-pantry-result';
import { GroceryList } from './entities/grocery-list.entity';
import { GroceryListsService } from './grocery-lists.service';

/**
 * HTTP routes under `/grocery-lists` for a user's shopping lists and their items, including adding
 * a recipe's ingredients and moving purchased items to the pantry.
 */
@Controller('grocery-lists')
export class GroceryListsController {
  constructor(private readonly groceryListsService: GroceryListsService) {}

  /** `GET /grocery-lists`: all of the user's lists. */
  @Get()
  public findAll(@CurrentUserId() userId: string): Promise<GroceryList[]> {
    return this.groceryListsService.findAll(userId);
  }

  /** `GET /grocery-lists/:listId`: one of the user's lists; 404 if it is not theirs. */
  @Get(':listId')
  public findOne(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.findOne(userId, listId);
  }

  /** `POST /grocery-lists`: creates an empty list. */
  @Post()
  public create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateGroceryListDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.create(userId, dto);
  }

  /** `PATCH /grocery-lists/:listId`: renames a list. */
  @Patch(':listId')
  public rename(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Body() dto: UpdateGroceryListDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.rename(userId, listId, dto);
  }

  /** `DELETE /grocery-lists/:listId`: deletes a list and responds 204 No Content. */
  @Delete(':listId')
  @HttpCode(204)
  public remove(@CurrentUserId() userId: string, @Param('listId') listId: string): Promise<void> {
    return this.groceryListsService.remove(userId, listId);
  }

  /** `POST /grocery-lists/:listId/items`: adds an item, combining it with a matching line. */
  @Post(':listId/items')
  public addItem(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Body() dto: AddGroceryItemDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.addItem(userId, listId, dto);
  }

  /** Adds a recipe's ingredients, scaled to the chosen servings. */
  @Post(':listId/recipes')
  public addRecipe(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Body() dto: AddRecipeToListDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.addRecipe(userId, listId, dto);
  }

  /**
   * `PATCH /grocery-lists/:listId/items/:itemId`: edits an item (name, amount, category, or
   * checked).
   */
  @Patch(':listId/items/:itemId')
  public updateItem(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGroceryItemDto,
  ): Promise<GroceryList> {
    return this.groceryListsService.updateItem(userId, listId, itemId, dto);
  }

  /**
   * `DELETE /grocery-lists/:listId/items/:itemId`: removes one item and returns the updated list.
   */
  @Delete(':listId/items/:itemId')
  public removeItem(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.removeItem(userId, listId, itemId);
  }

  /** Moves one item into the user's pantry and off the list. */
  @Post(':listId/items/:itemId/pantry')
  @HttpCode(200)
  public moveItemToPantry(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.moveItemToPantry(userId, listId, itemId);
  }

  /** Moves every checked item into the user's pantry and off the list. */
  @Post(':listId/purchased-items/pantry')
  @HttpCode(200)
  public movePurchasedToPantry(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
  ): Promise<MoveToPantryResult> {
    return this.groceryListsService.movePurchasedToPantry(userId, listId);
  }

  /** `DELETE /grocery-lists/:listId/purchased-items`: removes every checked item. */
  @Delete(':listId/purchased-items')
  public removePurchasedItems(
    @CurrentUserId() userId: string,
    @Param('listId') listId: string,
  ): Promise<GroceryList> {
    return this.groceryListsService.removePurchasedItems(userId, listId);
  }
}
