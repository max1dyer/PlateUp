import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Recipe } from '../recipes/entities/recipe.entity';
import { ShareRecipeDto } from './dto/share-recipe.dto';
import { SharedWithUser } from './dto/shared-with-user';
import { RecipeSharesService } from './recipe-shares.service';

/** HTTP routes under `/recipe-shares` for sharing recipes with specific users. */
@Controller('recipe-shares')
export class RecipeSharesController {
  constructor(private readonly recipeSharesService: RecipeSharesService) {}

  /** `GET /recipe-shares/received`: recipes other users shared with the signed-in user. */
  @Get('received')
  public findReceived(@CurrentUserId() userId: string): Promise<Recipe[]> {
    return this.recipeSharesService.findReceived(userId);
  }

  /** `GET /recipe-shares/recipes/:recipeId`: who the author shared the recipe with. */
  @Get('recipes/:recipeId')
  public findShares(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<SharedWithUser[]> {
    return this.recipeSharesService.findShares(userId, recipeId);
  }

  /** `POST /recipe-shares/recipes/:recipeId`: shares the recipe by username; returns the list. */
  @Post('recipes/:recipeId')
  @HttpCode(200)
  public share(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
    @Body() dto: ShareRecipeDto,
  ): Promise<SharedWithUser[]> {
    return this.recipeSharesService.share(userId, recipeId, dto);
  }

  /** `DELETE /recipe-shares/recipes/:recipeId/:recipientId`: revokes; returns the list. */
  @Delete('recipes/:recipeId/:recipientId')
  public revoke(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
    @Param('recipientId') recipientId: string,
  ): Promise<SharedWithUser[]> {
    return this.recipeSharesService.revoke(userId, recipeId, recipientId);
  }
}
