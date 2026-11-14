import { Injectable, NotFoundException } from '@nestjs/common';
import { guessCategory } from '../common/domain/ingredient-category';
import { Quantity } from '../common/domain/quantity';
import { isSameIngredient } from '../common/domain/ingredient-name';
import { QuantityDto } from '../common/dto/quantity.dto';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { PantryService } from '../pantry/pantry.service';
import { RecipesService } from '../recipes/recipes.service';
import { AddGroceryItemDto } from './dto/add-grocery-item.dto';
import { AddRecipeToListDto } from './dto/add-recipe-to-list.dto';
import { CreateGroceryListDto } from './dto/create-grocery-list.dto';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto';
import { MoveToPantryResult, SkippedPantryMove } from './dto/move-to-pantry-result';
import { GroceryListItem, GroceryListItemChanges } from './entities/grocery-list-item.entity';
import { GroceryList } from './entities/grocery-list.entity';
import { GroceryListRepository } from './repositories/grocery-list.repository';

/**
 * Use-case layer for grocery lists: loads the user's lists, applies item changes through the
 * `GroceryList` aggregate, and coordinates with recipes and the pantry through their services.
 */
@Injectable()
export class GroceryListsService {
  constructor(
    private readonly groceryLists: GroceryListRepository,
    private readonly recipesService: RecipesService,
    private readonly pantryService: PantryService,
  ) {}

  /** All of the user's lists. */
  public findAll(ownerId: string): Promise<GroceryList[]> {
    return this.groceryLists.findByOwner(ownerId);
  }

  /**
   * Loads one of the user's lists.
   *
   * @throws NotFoundException if it does not exist or belongs to someone else.
   */
  public async findOne(ownerId: string, listId: string): Promise<GroceryList> {
    const list = await this.groceryLists.findById(listId);
    if (!list || !list.isOwnedBy(ownerId)) {
      throw new NotFoundException(`Grocery list ${listId} not found.`);
    }
    return list;
  }

  /** Creates an empty list for the user. */
  public async create(ownerId: string, dto: CreateGroceryListDto): Promise<GroceryList> {
    return this.groceryLists.save(new GroceryList(ownerId, dto.name));
  }

  /** Renames one of the user's lists. */
  public async rename(
    ownerId: string,
    listId: string,
    dto: UpdateGroceryListDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    list.rename(dto.name);
    return this.groceryLists.save(list);
  }

  /** Deletes one of the user's lists. */
  public async remove(ownerId: string, listId: string): Promise<void> {
    await this.findOne(ownerId, listId);
    await this.groceryLists.delete(listId);
  }

  /** Adds an item to a list, combining it with a matching line if there is one. */
  public async addItem(
    ownerId: string,
    listId: string,
    dto: AddGroceryItemDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    list.addItem(dto.name, this.toQuantity(dto.quantity), dto.category);
    return this.groceryLists.save(list);
  }

  /**
   * Generates grocery items from a recipe the user can see, with every
   * ingredient scaled to `servings` and merged into matching lines (UC6).
   * Ingredients named in `excludeIngredients` (e.g. already in the pantry)
   * are left off.
   */
  public async addRecipe(
    ownerId: string,
    listId: string,
    dto: AddRecipeToListDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    const recipe = await this.recipesService.findOne(dto.recipeId, ownerId);
    const servings = dto.servings ?? recipe.servings;
    const excluded = dto.excludeIngredients ?? [];
    list.addItems(
      recipe
        .ingredientsFor(servings)
        // Skip ingredients the user chose to leave off, then guess a store section for each.
        .filter((ingredient) => !excluded.some((name) => isSameIngredient(name, ingredient.name)))
        .map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          category: guessCategory(ingredient.name),
        })),
    );
    return this.groceryLists.save(list);
  }

  /**
   * Edits one item on a list.
   *
   * @throws NotFoundException if the list or the item is not found.
   */
  public async updateItem(
    ownerId: string,
    listId: string,
    itemId: string,
    dto: UpdateGroceryItemDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    // The quantity arrives as a DTO (or null to clear it) and must become a `Quantity`.
    const { quantity, ...rest } = dto;
    const changes: GroceryListItemChanges = { ...rest };
    if (quantity !== undefined) {
      changes.quantity = this.toQuantity(quantity);
    }
    if (!list.updateItem(itemId, changes)) {
      throw this.itemNotFound(itemId);
    }
    return this.groceryLists.save(list);
  }

  /**
   * Removes one item from a list.
   *
   * @throws NotFoundException if the list or the item is not found.
   */
  public async removeItem(ownerId: string, listId: string, itemId: string): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    if (!list.removeItem(itemId)) {
      throw this.itemNotFound(itemId);
    }
    return this.groceryLists.save(list);
  }

  /**
   * "Move to Pantry": adds the item to the owner's pantry (combining it with a
   * matching pantry item) and then takes it off the list. If the pantry
   * refuses it (no amount, or a unit that can't be combined) the list is
   * left unchanged.
   */
  public async moveItemToPantry(
    ownerId: string,
    listId: string,
    itemId: string,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    const item = list.findItem(itemId);
    if (!item) {
      throw this.itemNotFound(itemId);
    }
    // Add to the pantry first: if it refuses the item, this throws and the list is not changed.
    await this.addToPantry(ownerId, item);
    list.removeItem(itemId);
    return this.groceryLists.save(list);
  }

  /**
   * "Move Selected to Pantry": moves every checked item as `moveItemToPantry`
   * does. Items the pantry refuses stay on the list and are reported as skipped.
   */
  public async movePurchasedToPantry(ownerId: string, listId: string): Promise<MoveToPantryResult> {
    const list = await this.findOne(ownerId, listId);
    const moved: string[] = [];
    const skipped: SkippedPantryMove[] = [];
    // Move items one at a time so one refusal does not stop the rest.
    for (const item of list.items.filter((candidate) => candidate.purchased)) {
      try {
        await this.addToPantry(ownerId, item);
      } catch (error) {
        // A validation error means the pantry refused this item; anything else is unexpected and
        // rethrown.
        if (error instanceof DomainValidationError) {
          skipped.push({ name: item.name, reason: error.message });
          continue;
        }
        throw error;
      }
      list.removeItem(item.id);
      moved.push(item.name);
    }
    return { list: await this.groceryLists.save(list), moved, skipped };
  }

  /** "Remove Checked Items": drops every purchased item from a list. */
  public async removePurchasedItems(ownerId: string, listId: string): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    list.removePurchasedItems();
    return this.groceryLists.save(list);
  }

  /** The pantry needs an amount, so an item without one is refused. */
  private async addToPantry(ownerId: string, item: GroceryListItem): Promise<void> {
    if (item.quantity === null) {
      throw new DomainValidationError(
        `Give ${item.name} an amount before moving it to your pantry.`,
      );
    }
    await this.pantryService.add(ownerId, { name: item.name, quantity: item.quantity });
  }

  /** Converts an optional request amount into a `Quantity` (null when absent). */
  private toQuantity(dto: QuantityDto | null | undefined): Quantity | null {
    return dto ? new Quantity(dto.amount, dto.unit) : null;
  }

  /** The 404 error for an item id that is not on the list. */
  private itemNotFound(itemId: string): NotFoundException {
    return new NotFoundException(`Grocery item ${itemId} not found.`);
  }
}
