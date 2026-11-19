import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { guessCategory } from '../common/domain/ingredient-category';
import { Quantity } from '../common/domain/quantity';
import { isSameIngredient } from '../common/domain/ingredient-name';
import { QuantityDto } from '../common/dto/quantity.dto';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { PantryService } from '../pantry/pantry.service';
import { PlannerService } from '../planner/planner.service';
import { RecipesService } from '../recipes/recipes.service';
import { AddGroceryItemDto } from './dto/add-grocery-item.dto';
import { AddPlannerWeekResult } from './dto/add-planner-week-result';
import { AddPlannerWeekDto } from './dto/add-planner-week.dto';
import { AddRecipeToListDto } from './dto/add-recipe-to-list.dto';
import { CreateGroceryListDto } from './dto/create-grocery-list.dto';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto';
import { MoveToPantryResult, SkippedPantryMove } from './dto/move-to-pantry-result';
import { GroceryListItem, GroceryListItemChanges } from './entities/grocery-list-item.entity';
import { GroceryList } from './entities/grocery-list.entity';
import { IngredientNeed, SkippedNeed, combineNeeds, shortfall } from './entities/shopping-needs';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { NotificationsService } from '../notifications/notifications.service';
import {
  GroceryListSharePayload,
  NotificationStatus,
  NotificationType,
} from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { ShareGroceryListDto } from './dto/share-grocery-list.dto';
import { AddListMemberDto } from './dto/add-list-member.dto';
import { ListMember } from './entities/list-member';

/**
 * Use-case layer for grocery lists: loads the user's lists, applies item changes through the
 * `GroceryList` aggregate, and coordinates with recipes and the pantry through their services.
 *
 * A list can be shared with other users, who can then see and edit it too, so the `ownerId`
 * parameter below is the acting user, not necessarily the list's owner. Changes to a shared list
 * are recorded in its activity so the others can see who did what.
 */
@Injectable()
export class GroceryListsService {
  constructor(
    private readonly groceryLists: GroceryListRepository,
    private readonly recipesService: RecipesService,
    private readonly pantryService: PantryService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly plannerService: PlannerService,
  ) {}

  /** The user's own lists and the lists shared with them. */
  public findAll(ownerId: string): Promise<GroceryList[]> {
    return this.groceryLists.findAccessibleTo(ownerId);
  }

  /**
   * Loads one of the user's lists.
   *
   * @throws NotFoundException if it does not exist or the user has no access to it.
   */
  public async findOne(ownerId: string, listId: string): Promise<GroceryList> {
    const list = await this.groceryLists.findById(listId);
    if (!list || !list.isAccessibleTo(ownerId)) {
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
    const oldName = list.name;
    list.rename(dto.name);
    await this.log(list, ownerId, `renamed the list from ${oldName}`);
    return this.groceryLists.save(list);
  }

  /**
   * Deletes one of the user's lists (for everyone it is shared with). Members' invite
   * notifications are removed too, since their link would no longer work.
   *
   * @throws ForbiddenException if the user is a member rather than the owner.
   */
  public async remove(ownerId: string, listId: string): Promise<void> {
    const list = await this.findOne(ownerId, listId);
    if (!list.isOwnedBy(ownerId)) {
      throw new ForbiddenException('Only the owner can delete this list. Leave it instead.');
    }
    await this.groceryLists.delete(listId);
    await Promise.all(
      list.members.map((member) => this.notificationsService.removeListInvites(member.id, listId)),
    );
  }

  /**
   * Shares the list with another user by username; they can then see and edit it, and they get a
   * notification on their home page linking to it.
   *
   * @throws ForbiddenException if the acting user is not the owner, or the user blocks live lists.
   * @throws NotFoundException if no user has that username.
   * @throws DomainValidationError if they already have the list.
   */
  public async addMember(
    ownerId: string,
    listId: string,
    dto: AddListMemberDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    if (!list.isOwnedBy(ownerId)) {
      throw new ForbiddenException('Only the owner can share this list.');
    }
    const user = await this.usersService.findByUsername(dto.username ?? '');
    // Someone who already has the list (including the owner) gets addMember's "already has" error.
    if (!list.isAccessibleTo(user.id) && user.preferences.blockListInvites) {
      throw new ForbiddenException(`${user.displayName} isn't accepting shared grocery lists.`);
    }
    list.addMember({ id: user.id, name: user.displayName });
    await this.log(list, ownerId, `shared the list with ${user.displayName}`);
    const saved = await this.groceryLists.save(list);
    const owner = await this.member(ownerId);
    await this.notificationsService.create(user.id, ownerId, NotificationType.GroceryListInvite, {
      senderName: owner.name,
      listId: list.id,
      listName: list.name,
    });
    return saved;
  }

  /**
   * Stops sharing the list with a member. The owner can remove anyone; a member can only remove
   * themselves ("Leave list"). Their invite notification is removed, since its link no longer works.
   *
   * @throws ForbiddenException if a member tries to remove someone else.
   * @throws NotFoundException if that user is not a member.
   */
  public async removeMember(
    ownerId: string,
    listId: string,
    memberId: string,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    if (!list.isOwnedBy(ownerId) && memberId !== ownerId) {
      throw new ForbiddenException('Only the owner can remove other people from this list.');
    }
    const member = list.members.find((each) => each.id === memberId);
    if (!member || !list.removeMember(memberId)) {
      throw new NotFoundException(`User ${memberId} is not on this list.`);
    }
    await this.log(
      list,
      ownerId,
      memberId === ownerId ? 'left the list' : `removed ${member.name} from the list`,
    );
    const saved = await this.groceryLists.save(list);
    await this.notificationsService.removeListInvites(memberId, listId);
    return saved;
  }

  /** Adds an item to a list, combining it with a matching line if there is one. */
  public async addItem(
    ownerId: string,
    listId: string,
    dto: AddGroceryItemDto,
  ): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    const item = list.addItem(
      dto.name,
      this.toQuantity(dto.quantity),
      dto.category,
      await this.member(ownerId),
    );
    await this.log(list, ownerId, `added ${item.name}`);
    return this.groceryLists.save(list);
  }

  /**
   * Generates grocery items from a recipe the user can see, with every
   * ingredient scaled to `servings` and merged into matching lines (UC6).
   * Ingredients named in `excludeIngredients` (e.g. already in the pantry)
   * are left off. With `onlyMissing`, what the pantry already holds is
   * subtracted first (as `addPlannerWeek` does), so a half-stocked ingredient
   * is added only for the rest.
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
    // Skip ingredients the user chose to leave off.
    const wanted: IngredientNeed[] = recipe
      .ingredientsFor(servings)
      .filter((ingredient) => !excluded.some((name) => isSameIngredient(name, ingredient.name)));
    const needs =
      dto.onlyMissing === true
        ? shortfall(wanted, await this.pantryService.findAll(ownerId)).toBuy
        : wanted;
    list.addItems(
      // Guess a store section for each.
      needs.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        category: guessCategory(ingredient.name),
      })),
      await this.member(ownerId),
    );
    await this.log(list, ownerId, `added the ingredients for ${recipe.title}`);
    return this.groceryLists.save(list);
  }

  /**
   * Generates grocery items from the meals planned between `from` and `to`
   * (UC6, story 2.3): each recipe's ingredients are scaled to the meal's
   * servings and the same ingredient is combined across meals. Unless
   * `usePantry` is false, what the pantry already holds is subtracted, and
   * fully covered ingredients are reported instead of added. Ingredients that
   * can't be combined (with each other or with the list) are skipped and
   * reported, while the rest are still added.
   *
   * @throws NotFoundException if the list is not the user's.
   * @throws DomainValidationError if the range is invalid or has no meals planned.
   */
  public async addPlannerWeek(
    ownerId: string,
    listId: string,
    dto: AddPlannerWeekDto,
  ): Promise<AddPlannerWeekResult> {
    const list = await this.findOne(ownerId, listId);
    const meals = await this.plannerService.mealsBetween(ownerId, dto.from, dto.to);
    const recipes = await this.recipesService.findManyVisibleTo(
      meals.map((meal) => meal.recipeId),
      ownerId,
    );
    // Every ingredient of every meal, scaled to that meal's servings.
    const needs: IngredientNeed[] = meals.flatMap((meal) => {
      const recipe = recipes.find((each) => each.id === meal.recipeId);
      return recipe ? recipe.ingredientsFor(meal.servings) : [];
    });
    if (needs.length === 0) {
      throw new DomainValidationError('No meals are planned for those days.');
    }

    const combined = combineNeeds(needs);
    const stock = dto.usePantry === false ? [] : await this.pantryService.findAll(ownerId);
    const { toBuy, covered } = shortfall(combined.needs, stock);

    const added: string[] = [];
    const skipped: SkippedNeed[] = [...combined.skipped];
    const addedBy = await this.member(ownerId);
    for (const need of toBuy) {
      // One at a time, so an ingredient the list holds in another unit doesn't block the rest.
      try {
        list.addItem(need.name, need.quantity, guessCategory(need.name), addedBy);
        added.push(need.name);
      } catch (error) {
        if (!(error instanceof DomainValidationError)) {
          throw error;
        }
        skipped.push({ name: need.name, reason: error.message });
      }
    }
    if (added.length > 0) {
      await this.log(list, ownerId, `added ${count(added.length)} from the meal plan`);
    }
    return {
      list: await this.groceryLists.save(list),
      added,
      coveredByPantry: covered,
      skipped,
    };
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
    const onlyChecked = Object.keys(dto).length === 1 && dto.purchased !== undefined;
    const action = onlyChecked ? (dto.purchased ? 'checked off' : 'unchecked') : 'edited';
    await this.log(list, ownerId, `${action} ${list.findItem(itemId)?.name ?? 'an item'}`);
    return this.groceryLists.save(list);
  }

  /**
   * Removes one item from a list.
   *
   * @throws NotFoundException if the list or the item is not found.
   */
  public async removeItem(ownerId: string, listId: string, itemId: string): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    const name = list.findItem(itemId)?.name;
    if (!list.removeItem(itemId)) {
      throw this.itemNotFound(itemId);
    }
    await this.log(list, ownerId, `removed ${name}`);
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
    await this.log(list, ownerId, `moved ${item.name} to their pantry`);
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
    if (moved.length > 0) {
      await this.log(list, ownerId, `moved ${count(moved.length)} to their pantry`);
    }
    return { list: await this.groceryLists.save(list), moved, skipped };
  }

  /** "Remove Checked Items": drops every purchased item from a list. */
  public async removePurchasedItems(ownerId: string, listId: string): Promise<GroceryList> {
    const list = await this.findOne(ownerId, listId);
    const removed = list.removePurchasedItems();
    if (removed > 0) {
      await this.log(list, ownerId, `removed ${count(removed)} that were checked off`);
    }
    return this.groceryLists.save(list);
  }

  /**
   * Sends a snapshot of one of the user's lists to another user as a notification they can accept
   * or reject. Nothing is added to the recipient's account until they accept.
   *
   * @throws NotFoundException if the list or the recipient is not found.
   * @throws ForbiddenException if the recipient blocks grocery list copies.
   * @throws DomainValidationError if the user tries to send a list to themselves.
   */
  public async share(ownerId: string, listId: string, dto: ShareGroceryListDto): Promise<void> {
    const list = await this.findOne(ownerId, listId);
    const recipient = await this.usersService.findByUsername(dto.recipientUsername);
    if (recipient.id === ownerId) {
      throw new DomainValidationError("You can't send a grocery list to yourself.");
    }
    if (recipient.preferences.blockListCopies) {
      throw new ForbiddenException(`${recipient.displayName} isn't accepting grocery list copies.`);
    }
    const sender = await this.usersService.findOne(ownerId);
    await this.notificationsService.create(
      recipient.id,
      ownerId,
      NotificationType.GroceryListShare,
      {
        senderName: sender.displayName,
        listName: list.name,
        // Plain data, so the notification stays valid even if the original list changes.
        items: list.items.map((item) => ({
          name: item.name,
          quantity: item.quantity
            ? { amount: item.quantity.amount, unit: item.quantity.unit }
            : null,
          category: item.category,
        })),
      },
    );
  }

  /**
   * Accepting a shared list: creates a new, independent list in the recipient's account from the
   * snapshot (nothing is checked off) and marks the notification accepted.
   *
   * @throws NotFoundException if the notification is not theirs or not a list share.
   * @throws ConflictException if it was already answered.
   */
  public async acceptShare(userId: string, notificationId: string): Promise<GroceryList> {
    const notification = await this.notificationsService.findPending(
      userId,
      notificationId,
      NotificationType.GroceryListShare,
    );
    const { listName, items } = notification.payload as GroceryListSharePayload;
    const list = new GroceryList(userId, listName);
    list.addItems(
      items.map((item) => ({
        name: item.name,
        quantity: item.quantity ? new Quantity(item.quantity.amount, item.quantity.unit) : null,
        category: item.category,
      })),
    );
    const saved = await this.groceryLists.save(list);
    await this.notificationsService.resolve(userId, notificationId, NotificationStatus.Accepted);
    return saved;
  }

  /** Rejecting a shared list: nothing is created; the notification is marked rejected. */
  public async rejectShare(userId: string, notificationId: string): Promise<void> {
    await this.notificationsService.findPending(
      userId,
      notificationId,
      NotificationType.GroceryListShare,
    );
    await this.notificationsService.resolve(userId, notificationId, NotificationStatus.Rejected);
  }

  /** Records a change in a shared list's activity (personal lists keep none). */
  private async log(list: GroceryList, userId: string, message: string): Promise<void> {
    if (list.isShared) {
      list.recordActivity(await this.member(userId), message);
    }
  }

  /** The user's id and display name, or their id twice if they have no account. */
  private async member(userId: string): Promise<ListMember> {
    try {
      return { id: userId, name: (await this.usersService.findOne(userId)).displayName };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { id: userId, name: userId };
      }
      throw error;
    }
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

/** "1 item" / "3 items". */
function count(n: number): string {
  return `${n} ${n === 1 ? 'item' : 'items'}`;
}
