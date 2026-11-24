import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { InMemoryNotificationRepository } from '../notifications/repositories/in-memory-notification.repository';
import { NotificationRepository } from '../notifications/repositories/notification.repository';
import { RecipeVisibility } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { InMemoryRecipeRepository } from '../recipes/repositories/in-memory-recipe.repository';
import { RecipeRepository } from '../recipes/repositories/recipe.repository';
import { buildCreateRecipeDto } from '../recipes/testing/recipe.fixtures';
import { InMemoryUserRepository } from '../users/repositories/in-memory-user.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { RecipeSharesService } from './recipe-shares.service';

describe('RecipeSharesService', () => {
  let service: RecipeSharesService;
  let recipes: RecipesService;
  let users: UsersService;
  let notifications: NotificationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecipeSharesService,
        RecipesService,
        UsersService,
        NotificationsService,
        { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
        { provide: UserRepository, useClass: InMemoryUserRepository },
        { provide: NotificationRepository, useClass: InMemoryNotificationRepository },
      ],
    }).compile();
    service = moduleRef.get(RecipeSharesService);
    recipes = moduleRef.get(RecipesService);
    users = moduleRef.get(UsersService);
    notifications = moduleRef.get(NotificationsService);
  });

  /** Registers a sender and a recipient, and gives the sender a private recipe. */
  async function setUp() {
    const peter = await users.register({ username: 'peter', displayName: 'Peter' });
    const bob = await users.register({ username: 'bob', displayName: 'Bob' });
    const recipe = await recipes.create(
      peter.id,
      buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
    );
    return { peter, bob, recipe };
  }

  it('share makes a private recipe visible to the recipient and notifies them', async () => {
    const { peter, bob, recipe } = await setUp();
    await expect(recipes.findOne(recipe.id, bob.id)).rejects.toThrow(NotFoundException);

    const shares = await service.share(peter.id, recipe.id, { recipientUsername: 'BOB' });

    expect(shares).toEqual([{ id: bob.id, username: 'bob', displayName: 'Bob' }]);
    expect((await recipes.findOne(recipe.id, bob.id)).id).toBe(recipe.id);
    expect((await service.findReceived(bob.id)).map((shared) => shared.id)).toEqual([recipe.id]);
    const [notification] = await notifications.findAll(bob.id);
    expect(notification.type).toBe(NotificationType.RecipeShare);
    expect(notification.payload).toEqual({
      senderName: 'Peter',
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    });
  });

  it('share is refused, with nothing sent, when the recipient blocks recipe shares', async () => {
    const { peter, bob, recipe } = await setUp();
    await users.updatePreferences(bob.id, { blockRecipeShares: true });

    await expect(service.share(peter.id, recipe.id, { recipientUsername: 'bob' })).rejects.toThrow(
      "Bob isn't accepting shared recipes.",
    );

    await expect(recipes.findOne(recipe.id, bob.id)).rejects.toThrow(NotFoundException);
    expect(await notifications.findAll(bob.id)).toHaveLength(0);
  });

  it('share refuses an unknown user, yourself, a repeat, or a recipe that is not yours', async () => {
    const { peter, bob, recipe } = await setUp();

    await expect(
      service.share(peter.id, recipe.id, { recipientUsername: 'nobody' }),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.share(peter.id, recipe.id, { recipientUsername: 'peter' }),
    ).rejects.toThrow(DomainValidationError);
    await service.share(peter.id, recipe.id, { recipientUsername: 'bob' });
    await expect(service.share(peter.id, recipe.id, { recipientUsername: 'bob' })).rejects.toThrow(
      ConflictException,
    );
    // Bob can see it now, but only Peter may share it on.
    await expect(service.share(bob.id, recipe.id, { recipientUsername: 'peter' })).rejects.toThrow(
      ForbiddenException,
    );
    expect(await notifications.findAll(bob.id)).toHaveLength(1);
  });

  it('revoke hides the recipe, replaces the share notification, and tells the recipient', async () => {
    const { peter, bob, recipe } = await setUp();
    await service.share(peter.id, recipe.id, { recipientUsername: 'bob' });

    const shares = await service.revoke(peter.id, recipe.id, bob.id);

    expect(shares).toEqual([]);
    await expect(recipes.findOne(recipe.id, bob.id)).rejects.toThrow(NotFoundException);
    expect(await service.findReceived(bob.id)).toHaveLength(0);
    const all = await notifications.findAll(bob.id);
    expect(all.map((notification) => notification.type)).toEqual([
      NotificationType.RecipeShareRevoked,
    ]);
    expect(all[0].payload).toMatchObject({ senderName: 'Peter', recipeTitle: recipe.title });
  });

  it('revoke 404s for a recipient it was never shared with', async () => {
    const { peter, bob, recipe } = await setUp();

    await expect(service.revoke(peter.id, recipe.id, bob.id)).rejects.toThrow(NotFoundException);
    expect(await notifications.findAll(bob.id)).toHaveLength(0);
  });

  it('findShares lists who the recipe is shared with', async () => {
    const { peter, bob, recipe } = await setUp();
    await service.share(peter.id, recipe.id, { recipientUsername: 'bob' });

    expect(await service.findShares(peter.id, recipe.id)).toEqual([
      { id: bob.id, username: 'bob', displayName: 'Bob' },
    ]);
  });
});
