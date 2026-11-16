import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Quantity } from '../common/domain/quantity';
import { CreateRecipeDto, RecipeIngredientDto } from './dto/create-recipe.dto';
import { ReviewRecipeDto } from './dto/review-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeIngredient } from './entities/recipe-ingredient';
import { Recipe, RecipeDetails, RecipeVisibility } from './entities/recipe.entity';
import { RecipeRepository } from './repositories/recipe.repository';

/**
 * Use-case layer for recipes: loads them from `RecipeRepository`, applies visibility and ownership
 * rules, turns DTOs into domain objects, and saves the results.
 */
@Injectable()
export class RecipesService {
  constructor(private readonly recipes: RecipeRepository) {}

  /** Every public recipe plus `userId`'s own private ones. */
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

  /**
   * Creates and stores a recipe by `authorId`. Missing optional fields default to an empty
   * description, no photo, no tags, and public visibility.
   */
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
      tags: dto.tags ?? [],
    });
    return this.recipes.save(recipe);
  }

  /**
   * Applies a partial edit. Only the author may edit (403 otherwise; 404 if they cannot see it).
   */
  public async update(recipeId: string, userId: string, dto: UpdateRecipeDto): Promise<Recipe> {
    const recipe = await this.findOwned(recipeId, userId);
    // Ingredients arrive as DTOs and must become `RecipeIngredient`s; every other field passes
    // through.
    const { ingredients, ...rest } = dto;
    const changes: Partial<RecipeDetails> = { ...rest };
    if (ingredients) {
      changes.ingredients = this.toIngredients(ingredients);
    }
    recipe.update(changes);
    return this.recipes.save(recipe);
  }

  /** Adds or replaces the user's review of a recipe they can see. */
  public async review(recipeId: string, userId: string, dto: ReviewRecipeDto): Promise<Recipe> {
    const recipe = await this.findOne(recipeId, userId);
    recipe.review(userId, dto.rating, dto.comment ?? '');
    return this.recipes.save(recipe);
  }

  /** Deletes a recipe. Only the author may delete it. */
  public async remove(recipeId: string, userId: string): Promise<void> {
    await this.findOwned(recipeId, userId);
    await this.recipes.delete(recipeId);
  }

  /** Recipes other users shared with `userId`. */
  public async findSharedWith(userId: string): Promise<Recipe[]> {
    const visible = await this.recipes.findVisibleTo(userId);
    return visible.filter((recipe) => recipe.isSharedWith(userId));
  }

  /**
   * Lets `recipientId` see the author's recipe.
   *
   * @throws ConflictException if it is already shared with them.
   */
  public async shareWith(recipeId: string, userId: string, recipientId: string): Promise<Recipe> {
    const recipe = await this.findOwned(recipeId, userId);
    if (!recipe.shareWith(recipientId)) {
      throw new ConflictException('This recipe is already shared with that user.');
    }
    return this.recipes.save(recipe);
  }

  /**
   * Stops sharing the author's recipe with `recipientId`.
   *
   * @throws NotFoundException if it was not shared with them.
   */
  public async revokeShare(recipeId: string, userId: string, recipientId: string): Promise<Recipe> {
    const recipe = await this.findOwned(recipeId, userId);
    if (!recipe.revokeShare(recipientId)) {
      throw new NotFoundException('This recipe is not shared with that user.');
    }
    return this.recipes.save(recipe);
  }

  /**
   * Loads a recipe the user can see and checks they wrote it.
   *
   * @throws NotFoundException if the recipe is missing or private to someone else.
   * @throws ForbiddenException if the user can see it but is not the author.
   */
  public async findOwned(recipeId: string, userId: string): Promise<Recipe> {
    const recipe = await this.findOne(recipeId, userId);
    if (!recipe.isOwnedBy(userId)) {
      throw new ForbiddenException('Only the author can modify this recipe.');
    }
    return recipe;
  }

  /** Converts request ingredient lines into validated domain objects. */
  private toIngredients(dtos: RecipeIngredientDto[]): RecipeIngredient[] {
    return dtos.map(
      (dto) => new RecipeIngredient(dto.name, new Quantity(dto.quantity.amount, dto.quantity.unit)),
    );
  }
}
