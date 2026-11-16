import { ForbiddenException, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { UsersService } from '../users/users.service';
import { ShareRecipeDto } from './dto/share-recipe.dto';
import { SharedWithUser } from './dto/shared-with-user';

/**
 * Use-case layer for sharing recipes with specific users. Combines the recipe, user and
 * notification services; the share itself is stored on the `Recipe`.
 */
@Injectable()
export class RecipeSharesService {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Recipes other users shared with this user. */
  public findReceived(userId: string): Promise<Recipe[]> {
    return this.recipesService.findSharedWith(userId);
  }

  /** The users the author's recipe is shared with. */
  public async findShares(authorId: string, recipeId: string): Promise<SharedWithUser[]> {
    return this.toSharedWith(await this.recipesService.findOwned(recipeId, authorId));
  }

  /**
   * Shares the author's recipe with another user: it becomes visible to them at once and they get
   * a notification linking to it.
   *
   * @throws NotFoundException if the recipe or the recipient is not found.
   * @throws ForbiddenException if the author is not the sender, or the recipient blocks shares.
   * @throws ConflictException if it is already shared with them.
   * @throws DomainValidationError if the author tries to share with themselves.
   */
  public async share(
    authorId: string,
    recipeId: string,
    dto: ShareRecipeDto,
  ): Promise<SharedWithUser[]> {
    // Check the recipe first so a stranger can't learn anyone's settings through it.
    await this.recipesService.findOwned(recipeId, authorId);
    const recipient = await this.usersService.findByUsername(dto.recipientUsername);
    if (recipient.id === authorId) {
      throw new DomainValidationError("You can't share a recipe with yourself.");
    }
    if (recipient.preferences.blockRecipeShares) {
      throw new ForbiddenException(`${recipient.displayName} isn't accepting shared recipes.`);
    }
    const recipe = await this.recipesService.shareWith(recipeId, authorId, recipient.id);
    const sender = await this.usersService.findOne(authorId);
    await this.notificationsService.create(recipient.id, authorId, NotificationType.RecipeShare, {
      senderName: sender.displayName,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    });
    return this.toSharedWith(recipe);
  }

  /**
   * Stops sharing: the recipient can no longer see the recipe. Their "shared with you"
   * notification is removed (its link would no longer work) and they are told it was revoked.
   *
   * @throws NotFoundException if it was not shared with that user.
   */
  public async revoke(
    authorId: string,
    recipeId: string,
    recipientId: string,
  ): Promise<SharedWithUser[]> {
    const recipe = await this.recipesService.revokeShare(recipeId, authorId, recipientId);
    const sender = await this.usersService.findOne(authorId);
    await this.notificationsService.removeRecipeShares(recipientId, recipeId);
    await this.notificationsService.create(
      recipientId,
      authorId,
      NotificationType.RecipeShareRevoked,
      { senderName: sender.displayName, recipeId: recipe.id, recipeTitle: recipe.title },
    );
    return this.toSharedWith(recipe);
  }

  /** The recipe's recipients as public user details. */
  private toSharedWith(recipe: Recipe): Promise<SharedWithUser[]> {
    return Promise.all(
      recipe.sharedWithIds.map(async (id) => {
        const user = await this.usersService.findOne(id);
        return { id: user.id, username: user.username, displayName: user.displayName };
      }),
    );
  }
}
