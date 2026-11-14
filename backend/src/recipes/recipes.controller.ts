import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ReviewRecipeDto } from './dto/review-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Recipe } from './entities/recipe.entity';
import { RecipesService } from './recipes.service';

/**
 * HTTP routes under `/recipes` for browsing, creating, editing, reviewing, and deleting recipes.
 * Each handler passes the acting user to `RecipesService`, which enforces visibility and ownership.
 */
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  /** `GET /recipes`: every public recipe plus the user's own private ones. */
  @Get()
  public findAll(@CurrentUserId() userId: string): Promise<Recipe[]> {
    return this.recipesService.findAllVisibleTo(userId);
  }

  /**
   * `GET /recipes/:recipeId`: one recipe; 404 if it is missing or someone else's private recipe.
   */
  @Get(':recipeId')
  public findOne(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<Recipe> {
    return this.recipesService.findOne(recipeId, userId);
  }

  /** `POST /recipes`: creates a recipe authored by the acting user. */
  @Post()
  public create(@CurrentUserId() userId: string, @Body() dto: CreateRecipeDto): Promise<Recipe> {
    return this.recipesService.create(userId, dto);
  }

  /** `PATCH /recipes/:recipeId`: edits a recipe; 403 unless the acting user is its author. */
  @Patch(':recipeId')
  public update(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.update(recipeId, userId, dto);
  }

  /** Each user has one review per recipe, so this creates or replaces it. */
  @Put(':recipeId/reviews/me')
  public review(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
    @Body() dto: ReviewRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.review(recipeId, userId, dto);
  }

  /** `DELETE /recipes/:recipeId`: deletes a recipe (author only) and responds 204 No Content. */
  @Delete(':recipeId')
  @HttpCode(204)
  public remove(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<void> {
    return this.recipesService.remove(recipeId, userId);
  }
}
