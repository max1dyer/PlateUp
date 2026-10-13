import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Recipe } from './entities/recipe.entity';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  public findAll(@CurrentUserId() userId: string): Promise<Recipe[]> {
    return this.recipesService.findAllVisibleTo(userId);
  }

  @Get(':recipeId')
  public findOne(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<Recipe> {
    return this.recipesService.findOne(recipeId, userId);
  }

  @Post()
  public create(@CurrentUserId() userId: string, @Body() dto: CreateRecipeDto): Promise<Recipe> {
    return this.recipesService.create(userId, dto);
  }

  @Patch(':recipeId')
  public update(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.update(recipeId, userId, dto);
  }

  @Delete(':recipeId')
  @HttpCode(204)
  public remove(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<void> {
    return this.recipesService.remove(recipeId, userId);
  }
}
