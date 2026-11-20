import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IngredientCategory } from '../common/domain/ingredient-category';
import { Quantity, Unit } from '../common/domain/quantity';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { RecipeVisibility } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { InMemoryRecipeRepository } from '../recipes/repositories/in-memory-recipe.repository';
import { RecipeRepository } from '../recipes/repositories/recipe.repository';
import { buildCreateRecipeDto } from '../recipes/testing/recipe.fixtures';
import { PantryService } from '../pantry/pantry.service';
import { InMemoryPantryItemRepository } from '../pantry/repositories/in-memory-pantry-item.repository';
import { PantryItemRepository } from '../pantry/repositories/pantry-item.repository';
import { MealSlot } from '../planner/entities/planned-meal.entity';
import { PlannerService } from '../planner/planner.service';
import { InMemoryPlannedMealRepository } from '../planner/repositories/in-memory-planned-meal.repository';
import { PlannedMealRepository } from '../planner/repositories/planned-meal.repository';
import { InMemoryUserRepository } from '../users/repositories/in-memory-user.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { GroceryListsService } from './grocery-lists.service';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { InMemoryGroceryListRepository } from './repositories/in-memory-grocery-list.repository';
import { NotificationsService } from '../notifications/notifications.service';
import {
  GroceryListSharePayload,
  NotificationStatus,
  NotificationType,
} from '../notifications/entities/notification.entity';
import { InMemoryNotificationRepository } from '../notifications/repositories/in-memory-notification.repository';
import { NotificationRepository } from '../notifications/repositories/notification.repository';

describe('GroceryListsService', () => {
  let service: GroceryListsService;
  let recipes: RecipesService;
  let pantry: PantryService;
  let users: UsersService;
  let notifications: NotificationsService;
  let planner: PlannerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GroceryListsService,
        RecipesService,
        PantryService,
        NotificationsService,
        PlannerService,
        UsersService,
        { provide: PantryItemRepository, useClass: InMemoryPantryItemRepository },
        { provide: PlannedMealRepository, useClass: InMemoryPlannedMealRepository },
        { provide: UserRepository, useClass: InMemoryUserRepository },
        { provide: GroceryListRepository, useClass: InMemoryGroceryListRepository },
        { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
        { provide: NotificationRepository, useClass: InMemoryNotificationRepository },
      ],
    }).compile();
    service = moduleRef.get(GroceryListsService);
    recipes = moduleRef.get(RecipesService);
    pantry = moduleRef.get(PantryService);
    users = moduleRef.get(UsersService);
    notifications = moduleRef.get(NotificationsService);
    planner = moduleRef.get(PlannerService);
  });

  it('create and findAll are scoped to the owner', async () => {
    await service.create('alice', { name: 'Weekly' });

    expect(await service.findAll('alice')).toHaveLength(1);
    expect(await service.findAll('bob')).toHaveLength(0);
  });

  it('findOne 404s for another user’s list', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await expect(service.findOne('bob', list.id)).rejects.toThrow(NotFoundException);
  });

  it('rename changes the list name', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    const renamed = await service.rename('alice', list.id, { name: 'Party' });
    expect(renamed.name).toBe('Party');
  });

  it('addItem converts the optional quantity', async () => {
    const list = await service.create('alice', { name: 'Weekly' });

    await service.addItem('alice', list.id, { name: 'Chips' });
    const updated = await service.addItem('alice', list.id, {
      name: 'Milk',
      quantity: { amount: 1, unit: Unit.Liter },
    });

    expect(updated.items.map((item) => item.quantity?.unit ?? null)).toEqual([null, Unit.Liter]);
  });

  it('updateItem, removeItem and removePurchasedItems manage items', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await service.addItem('alice', list.id, { name: 'Milk' });
    await service.addItem('alice', list.id, { name: 'Bread' });
    const [milk, bread] = list.items;

    await service.updateItem('alice', list.id, milk.id, { purchased: true });
    await service.removePurchasedItems('alice', list.id);
    expect(list.items).toEqual([bread]);

    await service.removeItem('alice', list.id, bread.id);
    expect(list.items).toHaveLength(0);
  });

  it('updateItem edits the quantity and name of an item', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await service.addItem('alice', list.id, {
      name: 'Milk',
      quantity: { amount: 1, unit: Unit.Liter },
    });
    const [milk] = list.items;

    const updated = await service.updateItem('alice', list.id, milk.id, {
      name: 'Oat milk',
      quantity: { amount: 500, unit: Unit.Milliliter },
    });

    expect(updated.items[0].name).toBe('Oat milk');
    expect(updated.items[0].quantity?.equals(new Quantity(500, Unit.Milliliter))).toBe(true);
    expect(updated.items[0].purchased).toBe(false);
  });

  it('updateItem leaves omitted fields unchanged and clears a null quantity', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await service.addItem('alice', list.id, {
      name: 'Eggs',
      quantity: { amount: 12, unit: Unit.Piece },
    });
    const [eggs] = list.items;

    await service.updateItem('alice', list.id, eggs.id, { purchased: true });
    expect(eggs.name).toBe('Eggs');
    expect(eggs.quantity?.equals(new Quantity(12, Unit.Piece))).toBe(true);

    await service.updateItem('alice', list.id, eggs.id, { quantity: null });
    expect(eggs.quantity).toBeNull();
    expect(eggs.purchased).toBe(true);
  });

  it('addItem and updateItem store the category', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await service.addItem('alice', list.id, {
      name: 'Fish sauce',
      quantity: { amount: 1, unit: Unit.Bottle },
      category: IngredientCategory.OilSauce,
    });
    await service.addItem('alice', list.id, { name: 'Lemongrass' });
    const [fishSauce, lemongrass] = list.items;

    expect(fishSauce.category).toBe(IngredientCategory.OilSauce);
    expect(lemongrass.category).toBe(IngredientCategory.Other);

    await service.updateItem('alice', list.id, lemongrass.id, {
      category: IngredientCategory.Produce,
    });
    expect(lemongrass.category).toBe(IngredientCategory.Produce);
  });

  it('item operations 404 for unknown items', async () => {
    const list = await service.create('alice', { name: 'Weekly' });

    await expect(
      service.updateItem('alice', list.id, 'missing', { purchased: true }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.removeItem('alice', list.id, 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deletes the list', async () => {
    const list = await service.create('alice', { name: 'Weekly' });

    await service.remove('alice', list.id);

    await expect(service.findOne('alice', list.id)).rejects.toThrow(NotFoundException);
  });

  describe('addRecipe (UC6)', () => {
    // buildCreateRecipeDto serves 2 with 400 g chicken breast and 1 cup rice.
    it('adds every ingredient scaled to the chosen servings', async () => {
      const recipe = await recipes.create('chef', buildCreateRecipeDto());
      const list = await service.create('alice', { name: 'Weekly' });

      const updated = await service.addRecipe('alice', list.id, {
        recipeId: recipe.id,
        servings: 4,
      });

      expect(updated.items.map((item) => [item.name, item.quantity])).toEqual([
        ['Chicken breast', new Quantity(800, Unit.Gram)],
        ['Rice', new Quantity(2, Unit.Cup)],
      ]);
    });

    it("defaults to the recipe's own servings and guesses each category", async () => {
      const recipe = await recipes.create('chef', buildCreateRecipeDto());
      const list = await service.create('alice', { name: 'Weekly' });

      const updated = await service.addRecipe('alice', list.id, { recipeId: recipe.id });

      expect(updated.items[0].quantity).toEqual(new Quantity(400, Unit.Gram));
      expect(updated.items.map((item) => item.category)).toEqual([
        IngredientCategory.Protein,
        IngredientCategory.Carbs,
      ]);
    });

    it('combines ingredients already on the list', async () => {
      const recipe = await recipes.create('chef', buildCreateRecipeDto());
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, {
        name: 'rice',
        quantity: { amount: 1, unit: Unit.Cup },
      });

      const updated = await service.addRecipe('alice', list.id, { recipeId: recipe.id });

      expect(updated.items).toHaveLength(2);
      expect(updated.items[0].quantity).toEqual(new Quantity(2, Unit.Cup));
      expect(updated.items[0].name).toBe('rice');
    });

    it('adds nothing when one ingredient cannot be combined', async () => {
      const recipe = await recipes.create('chef', buildCreateRecipeDto());
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, {
        name: 'Rice',
        quantity: { amount: 1, unit: Unit.Bag },
      });

      await expect(service.addRecipe('alice', list.id, { recipeId: recipe.id })).rejects.toThrow(
        DomainValidationError,
      );
      expect((await service.findOne('alice', list.id)).items).toHaveLength(1);
    });

    it("404s for another user's private recipe", async () => {
      const recipe = await recipes.create(
        'chef',
        buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
      );
      const list = await service.create('alice', { name: 'Weekly' });

      await expect(service.addRecipe('alice', list.id, { recipeId: recipe.id })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects servings that are not a positive whole number', async () => {
      const recipe = await recipes.create('chef', buildCreateRecipeDto());
      const list = await service.create('alice', { name: 'Weekly' });

      await expect(
        service.addRecipe('alice', list.id, { recipeId: recipe.id, servings: 0 }),
      ).rejects.toThrow(DomainValidationError);
    });
  });

  describe('pantry', () => {
    const liter = (amount: number) => ({ amount, unit: Unit.Liter });

    it('addRecipe leaves off excluded ingredients, ignoring case and spacing', async () => {
      const recipe = await recipes.create('alice', buildCreateRecipeDto());
      const names = recipe.ingredientsFor(recipe.servings).map((ingredient) => ingredient.name);
      const list = await service.create('alice', { name: 'Weekly' });

      const updated = await service.addRecipe('alice', list.id, {
        recipeId: recipe.id,
        excludeIngredients: [`  ${names[0].toUpperCase()} `],
      });

      expect(updated.items.map((item) => item.name)).toEqual(names.slice(1));
    });

    it('addRecipe estimates the cost of what it adds', async () => {
      const recipe = await recipes.create('alice', buildCreateRecipeDto());
      const list = await service.create('alice', { name: 'Weekly' });

      const updated = await service.addRecipe('alice', list.id, { recipeId: recipe.id });

      const costs = updated.items.map((item) => item.estimatedCost ?? 0);
      expect(costs.every((cost) => cost > 0)).toBe(true);
      expect(updated.estimatedTotal).toBe(Math.round((costs[0] + costs[1]) * 100) / 100);
    });

    it('moveItemToPantry adds the item to the pantry and removes it from the list', async () => {
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, { name: 'Milk', quantity: liter(1) });
      await pantry.add('alice', { name: 'milk', quantity: liter(0.5) });

      const updated = await service.moveItemToPantry('alice', list.id, list.items[0].id);

      expect(updated.items).toHaveLength(0);
      const [milk] = await pantry.findAll('alice');
      expect(milk.quantity).toEqual(new Quantity(1.5, Unit.Liter));
    });

    it('moveItemToPantry keeps the item’s store section in the pantry', async () => {
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, {
        name: 'Oat milk',
        quantity: liter(1),
        category: IngredientCategory.Drinks,
      });

      await service.moveItemToPantry('alice', list.id, list.items[0].id);

      const [oatMilk] = await pantry.findAll('alice');
      expect(oatMilk.category).toBe(IngredientCategory.Drinks);
    });

    it('moveItemToPantry keeps an item the pantry refuses on the list', async () => {
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, { name: 'Chips' });
      await service.addItem('alice', list.id, { name: 'Milk', quantity: liter(1) });
      await pantry.add('alice', { name: 'Milk', quantity: { amount: 1, unit: Unit.Carton } });
      const [chips, milk] = list.items;

      await expect(service.moveItemToPantry('alice', list.id, chips.id)).rejects.toThrow(
        'Give Chips an amount',
      );
      await expect(service.moveItemToPantry('alice', list.id, milk.id)).rejects.toThrow(
        DomainValidationError,
      );
      expect(list.items).toHaveLength(2);
    });

    it('moveItemToPantry 404s for an unknown item or another user’s list', async () => {
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, { name: 'Milk', quantity: liter(1) });

      await expect(service.moveItemToPantry('alice', list.id, 'nope')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.moveItemToPantry('bob', list.id, list.items[0].id)).rejects.toThrow(
        NotFoundException,
      );
      expect(await pantry.findAll('bob')).toHaveLength(0);
    });

    it('movePurchasedToPantry moves checked items and reports the ones it skips', async () => {
      const list = await service.create('alice', { name: 'Weekly' });
      await service.addItem('alice', list.id, { name: 'Milk', quantity: liter(1) });
      await service.addItem('alice', list.id, { name: 'Chips' });
      await service.addItem('alice', list.id, { name: 'Bread', quantity: liter(1) });
      const [milk, chips, bread] = list.items;
      await service.updateItem('alice', list.id, milk.id, { purchased: true });
      await service.updateItem('alice', list.id, chips.id, { purchased: true });

      const result = await service.movePurchasedToPantry('alice', list.id);

      expect(result.moved).toEqual(['Milk']);
      expect(result.skipped).toEqual([
        { name: 'Chips', reason: expect.stringContaining('amount') },
      ]);
      expect(result.list.items).toEqual([chips, bread]);
      expect((await pantry.findAll('alice')).map((item) => item.name)).toEqual(['Milk']);
    });
  });

  describe('sharing a list', () => {
    const user = (username: string) => users.register({ username, displayName: username });

    /** Registers a sender and a recipient, and gives the sender a list with two items. */
    async function setUp() {
      const sender = await user('peter');
      const recipient = await user('bob');
      const list = await service.create(sender.id, { name: 'Weekly' });
      await service.addItem(sender.id, list.id, {
        name: 'Eggs',
        quantity: { amount: 2, unit: Unit.Carton },
        category: IngredientCategory.Protein,
      });
      await service.addItem(sender.id, list.id, { name: 'Chips' });
      return { sender, recipient, list };
    }

    it('share sends the recipient a snapshot and adds nothing to their account yet', async () => {
      const { sender, recipient, list } = await setUp();

      await service.share(sender.id, list.id, { recipientUsername: 'BOB' });

      const [notification] = await notifications.findAll(recipient.id);
      const payload = notification.payload as GroceryListSharePayload;
      expect(notification.senderId).toBe(sender.id);
      expect(notification.status).toBe(NotificationStatus.Pending);
      expect(payload.senderName).toBe('peter');
      expect(payload.listName).toBe('Weekly');
      expect(payload.items.map((item) => item.name)).toEqual(['Eggs', 'Chips']);
      expect(await service.findAll(recipient.id)).toHaveLength(0);
    });

    it('share refuses an unknown recipient, yourself, or a list that is not yours', async () => {
      const { sender, recipient, list } = await setUp();

      await expect(
        service.share(sender.id, list.id, { recipientUsername: 'nobody' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.share(sender.id, list.id, { recipientUsername: 'peter' }),
      ).rejects.toThrow(DomainValidationError);
      await expect(
        service.share(recipient.id, list.id, { recipientUsername: 'peter' }),
      ).rejects.toThrow(NotFoundException);
      expect(await notifications.findAll(recipient.id)).toHaveLength(0);
    });

    it('share refuses a recipient who blocks grocery list copies', async () => {
      const { sender, recipient, list } = await setUp();
      await users.updatePreferences(recipient.id, { blockListCopies: true });

      await expect(service.share(sender.id, list.id, { recipientUsername: 'bob' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(await notifications.findAll(recipient.id)).toHaveLength(0);
    });

    it('acceptShare creates an independent list in the recipient account', async () => {
      const { sender, recipient, list } = await setUp();
      await service.share(sender.id, list.id, { recipientUsername: 'bob' });
      const [notification] = await notifications.findAll(recipient.id);

      // Editing the original after sending must not change what the recipient gets.
      await service.addItem(sender.id, list.id, { name: 'Milk' });
      const copy = await service.acceptShare(recipient.id, notification.id);

      expect(copy.id).not.toBe(list.id);
      expect(copy.isOwnedBy(recipient.id)).toBe(true);
      expect(copy.name).toBe('Weekly');
      expect(copy.items.map((item) => item.name)).toEqual(['Eggs', 'Chips']);
      expect(copy.items[0].quantity).toEqual(new Quantity(2, Unit.Carton));
      expect(copy.items[0].category).toBe(IngredientCategory.Protein);
      expect(copy.items.every((item) => !item.purchased)).toBe(true);
      expect(await service.findAll(recipient.id)).toHaveLength(1);
      expect((await notifications.findOne(recipient.id, notification.id)).status).toBe(
        NotificationStatus.Accepted,
      );
    });

    it('rejectShare creates no list and marks the notification rejected', async () => {
      const { sender, recipient, list } = await setUp();
      await service.share(sender.id, list.id, { recipientUsername: 'bob' });
      const [notification] = await notifications.findAll(recipient.id);

      await service.rejectShare(recipient.id, notification.id);

      expect(await service.findAll(recipient.id)).toHaveLength(0);
      expect((await notifications.findOne(recipient.id, notification.id)).status).toBe(
        NotificationStatus.Rejected,
      );
    });

    it('a shared list can only be answered once', async () => {
      const { sender, recipient, list } = await setUp();
      await service.share(sender.id, list.id, { recipientUsername: 'bob' });
      const [notification] = await notifications.findAll(recipient.id);
      await service.acceptShare(recipient.id, notification.id);

      await expect(service.acceptShare(recipient.id, notification.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.rejectShare(recipient.id, notification.id)).rejects.toThrow(
        ConflictException,
      );
      expect(await service.findAll(recipient.id)).toHaveLength(1);
    });

    it('only the recipient can answer a shared list', async () => {
      const { sender, recipient, list } = await setUp();
      await service.share(sender.id, list.id, { recipientUsername: 'bob' });
      const [notification] = await notifications.findAll(recipient.id);

      await expect(service.acceptShare(sender.id, notification.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.rejectShare(sender.id, notification.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addPlannerWeek (UC6)', () => {
    const week = { from: '2026-09-21', to: '2026-09-27' };
    let riceBowl: string;
    let friedRice: string;

    beforeEach(async () => {
      riceBowl = (
        await recipes.create(
          'chef',
          buildCreateRecipeDto({
            servings: 2,
            ingredients: [
              { name: 'Rice', quantity: { amount: 1, unit: Unit.Cup } },
              { name: 'Chicken breast', quantity: { amount: 400, unit: Unit.Gram } },
            ],
          }),
        )
      ).id;
      friedRice = (
        await recipes.create(
          'chef',
          buildCreateRecipeDto({
            servings: 1,
            ingredients: [
              { name: 'rice', quantity: { amount: 0.5, unit: Unit.Cup } },
              { name: 'Eggs', quantity: { amount: 2, unit: Unit.Piece } },
            ],
          }),
        )
      ).id;
    });

    const plan = (recipeId: string, date: string, servings: number) =>
      planner.plan('alice', { recipeId, date, slot: MealSlot.Dinner, servings });

    it('adds every ingredient for the week, scaled and combined across meals', async () => {
      const list = await service.create('alice', { name: 'Week' });
      await plan(riceBowl, '2026-09-21', 4);
      await plan(friedRice, '2026-09-23', 1);
      await plan(friedRice, '2026-09-28', 1); // next week: not included

      const result = await service.addPlannerWeek('alice', list.id, { ...week, usePantry: false });

      expect(result.added).toEqual(['Rice', 'Chicken breast', 'Eggs']);
      const byName = new Map(result.list.items.map((item) => [item.name, item.quantity]));
      expect(byName.get('Rice')?.equals(new Quantity(2.5, Unit.Cup))).toBe(true);
      expect(byName.get('Chicken breast')?.equals(new Quantity(800, Unit.Gram))).toBe(true);
      expect(byName.get('Eggs')?.equals(new Quantity(2, Unit.Piece))).toBe(true);
      expect(result.list.items.find((item) => item.name === 'Chicken breast')?.category).toBe(
        IngredientCategory.Protein,
      );
    });

    it('subtracts what the pantry holds and reports what it covers', async () => {
      const list = await service.create('alice', { name: 'Week' });
      await plan(riceBowl, '2026-09-21', 2);
      await pantry.add('alice', { name: 'Rice', quantity: { amount: 0.25, unit: Unit.Cup } });
      await pantry.add('alice', {
        name: 'chicken breast',
        quantity: { amount: 1, unit: Unit.Kilogram },
      });

      const result = await service.addPlannerWeek('alice', list.id, week);

      expect(result.coveredByPantry).toEqual(['Chicken breast']);
      expect(result.added).toEqual(['Rice']);
      expect(result.list.items).toHaveLength(1);
      expect(result.list.items[0].quantity?.equals(new Quantity(0.75, Unit.Cup))).toBe(true);
      expect(await pantry.findAll('alice')).toHaveLength(2);
    });

    it('skips an ingredient the list holds in another unit and adds the rest', async () => {
      const list = await service.create('alice', { name: 'Week' });
      await service.addItem('alice', list.id, {
        name: 'Rice',
        quantity: { amount: 1, unit: Unit.Bag },
      });
      await plan(riceBowl, '2026-09-21', 2);

      const result = await service.addPlannerWeek('alice', list.id, { ...week, usePantry: false });

      expect(result.added).toEqual(['Chicken breast']);
      expect(result.skipped.map((each) => each.name)).toEqual(['Rice']);
    });

    it('refuses a week with nothing planned', async () => {
      const list = await service.create('alice', { name: 'Week' });

      await expect(service.addPlannerWeek('alice', list.id, week)).rejects.toThrow(
        'No meals are planned for those days.',
      );
    });

    it('404s for another user’s list', async () => {
      const list = await service.create('bob', { name: 'Week' });
      await plan(riceBowl, '2026-09-21', 2);

      await expect(service.addPlannerWeek('alice', list.id, week)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('shared lists', () => {
    const register = (username: string) => users.register({ username, displayName: username });

    it('lets members see and edit the list, tags their items, and logs activity', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      const list = await service.create(alice.id, { name: 'Shared' });
      await service.addMember(alice.id, list.id, { username: 'bob' });

      const updated = await service.addItem(bob.id, list.id, { name: 'Milk' });

      expect(updated.items[0].addedBy).toEqual({ id: bob.id, name: 'bob' });
      expect(updated.toJSON().activity[0]).toMatchObject({
        by: { id: bob.id },
        message: 'added Milk',
      });
      expect((await service.findAll(bob.id)).map((each) => each.id)).toEqual([list.id]);
      await expect(service.findOne('carol', list.id)).rejects.toThrow(NotFoundException);
    });

    it('only lets the owner share, remove others, or delete the list', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      await register('carol');
      const list = await service.create(alice.id, { name: 'Shared' });
      await service.addMember(alice.id, list.id, { username: 'bob' });

      await expect(service.addMember(bob.id, list.id, { username: 'carol' })).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.removeMember(bob.id, list.id, alice.id)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove(bob.id, list.id)).rejects.toThrow(ForbiddenException);
    });

    it('lets a member leave, after which they lose access', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      const list = await service.create(alice.id, { name: 'Shared' });
      await service.addMember(alice.id, list.id, { username: 'bob' });

      await service.removeMember(bob.id, list.id, bob.id);

      await expect(service.findOne(bob.id, list.id)).rejects.toThrow(NotFoundException);
    });

    it('sends the new member an invite notification linking to the list', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      const list = await service.create(alice.id, { name: 'Shared' });

      await service.addMember(alice.id, list.id, { username: 'bob' });

      const [invite] = await notifications.findAll(bob.id);
      expect(invite.type).toBe(NotificationType.GroceryListInvite);
      expect(invite.senderId).toBe(alice.id);
      expect(invite.payload).toEqual({ senderName: 'alice', listId: list.id, listName: 'Shared' });
      expect(await notifications.findAll(alice.id)).toHaveLength(0);
    });

    it('removes the invite when the member leaves, is removed, or the list is deleted', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      const carol = await register('carol');
      const dave = await register('dave');
      const list = await service.create(alice.id, { name: 'Shared' });
      for (const username of ['bob', 'carol', 'dave']) {
        await service.addMember(alice.id, list.id, { username });
      }

      await service.removeMember(bob.id, list.id, bob.id);
      await service.removeMember(alice.id, list.id, carol.id);
      expect(await notifications.findAll(bob.id)).toHaveLength(0);
      expect(await notifications.findAll(carol.id)).toHaveLength(0);
      expect(await notifications.findAll(dave.id)).toHaveLength(1);

      await service.remove(alice.id, list.id);
      expect(await notifications.findAll(dave.id)).toHaveLength(0);
    });

    it('does not notify anyone when sharing is refused', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      const list = await service.create(alice.id, { name: 'Shared' });
      await service.addMember(alice.id, list.id, { username: 'bob' });

      await expect(service.addMember(alice.id, list.id, { username: 'bob' })).rejects.toThrow(
        DomainValidationError,
      );
      expect(await notifications.findAll(bob.id)).toHaveLength(1);
    });

    it('refuses adding someone who blocks live lists, without notifying them', async () => {
      const alice = await register('alice');
      const bob = await register('bob');
      await users.updatePreferences(bob.id, { blockListInvites: true });
      const list = await service.create(alice.id, { name: 'Shared' });

      await expect(service.addMember(alice.id, list.id, { username: 'bob' })).rejects.toThrow(
        ForbiddenException,
      );
      expect((await service.findOne(alice.id, list.id)).members).toHaveLength(0);
      expect(await notifications.findAll(bob.id)).toHaveLength(0);
    });

    it('refuses sharing with someone who already has the list', async () => {
      const alice = await register('alice');
      const list = await service.create(alice.id, { name: 'Mine' });
      await expect(service.addMember(alice.id, list.id, { username: 'alice' })).rejects.toThrow(
        DomainValidationError,
      );
    });
  });
});
