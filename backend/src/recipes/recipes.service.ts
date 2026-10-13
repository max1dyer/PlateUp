import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Quantity } from '../common/domain/quantity';
import { CreateRecipeDto, RecipeIngredientDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeIngredient } from './entities/recipe-ingredient';
import { Recipe, RecipeDetails, RecipeVisibility } from './entities/recipe.entity';
import { RecipeRepository } from './repositories/recipe.repository';

@Injectable()
export class RecipesService {
  constructor(private readonly recipes: RecipeRepository) {}

  public findAllVisibleTo(userId: string): Promise<Recipe[]> {
    return this.recipes.findVisibleTo(userId);
  }

  /** Private recipes are reported as not found to anyone but their author. */
  public async findOne(recipeId: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipes.findById(recipeId);
    if (!recipe || !recipe.isVisibleTo(userId)) {
      throw new NotFoundException(`Recipe ${recipeId} not found.`);
    }
    return recipe;
  }

  /** Looks up several recipes, silently skipping ones that are gone or not visible. */
  public async findManyVisibleTo(recipeIds: string[], userId: string): Promise<Recipe[]> {
    const recipes = await Promise.all(recipeIds.map((id) => this.recipes.findById(id)));
    return recipes.filter((recipe): recipe is Recipe => !!recipe && recipe.isVisibleTo(userId));
  }

  public async create(authorId: string, dto: CreateRecipeDto): Promise<Recipe> {
    const recipe = new Recipe(authorId, {
      title: dto.title,
      description: dto.description ?? '',
      thumbnailUrl: dto.thumbnailUrl ?? null,
      servings: dto.servings,
      prepTimeMinutes: dto.prepTimeMinutes,
      ingredients: this.toIngredients(dto.ingredients),
      steps: dto.steps,
      nutrition: dto.nutrition,
      visibility: dto.visibility ?? RecipeVisibility.Public,
    });
    return this.recipes.save(recipe);
  }

  public async update(recipeId: string, userId: string, dto: UpdateRecipeDto): Promise<Recipe> {
    const recipe = await this.findOwned(recipeId, userId);
    const { ingredients, ...rest } = dto;
    const changes: Partial<RecipeDetails> = { ...rest };
    if (ingredients) {
      changes.ingredients = this.toIngredients(ingredients);
    }
    recipe.update(changes);
    return this.recipes.save(recipe);
  }

  public async remove(recipeId: string, userId: string): Promise<void> {
    await this.findOwned(recipeId, userId);
    await this.recipes.delete(recipeId);
  }

  private async findOwned(recipeId: string, userId: string): Promise<Recipe> {
    const recipe = await this.findOne(recipeId, userId);
    if (!recipe.isOwnedBy(userId)) {
      throw new ForbiddenException('Only the author can modify this recipe.');
    }
    return recipe;
  }

  private toIngredients(dtos: RecipeIngredientDto[]): RecipeIngredient[] {
    return dtos.map(
      (dto) => new RecipeIngredient(dto.name, new Quantity(dto.quantity.amount, dto.quantity.unit)),
    );
  }
}
