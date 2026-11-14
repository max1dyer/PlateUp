import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LogInDto } from './dto/log-in.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences';
import { UserRepository } from './repositories/user.repository';

/**
 * Use-case layer for accounts: registration, sign-in, profile and preference edits, and saved
 * recipes. Recipe lookups go through `RecipesService`, never the recipe repository.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly recipesService: RecipesService,
  ) {}

  /**
   * Creates an account.
   *
   * @throws ConflictException if the username is already taken (case-insensitive).
   */
  public async register(dto: CreateUserDto): Promise<User> {
    if (await this.users.findByUsername(dto.username)) {
      throw new ConflictException(`Username "${dto.username}" is already taken.`);
    }
    const user = new User(dto.username, {
      displayName: dto.displayName,
      bio: dto.bio ?? '',
      profilePictureUrl: dto.profilePictureUrl ?? null,
    });
    return this.users.save(user);
  }

  /**
   * TEMPORARY: signs in by username alone, until Supabase authentication
   * replaces it. 404s for an unknown username.
   */
  public async logIn(dto: LogInDto): Promise<User> {
    const user = await this.users.findByUsername(dto.username ?? '');
    if (!user) {
      throw new NotFoundException(`No account with the username "${dto.username}".`);
    }
    return user;
  }

  /**
   * Loads a user by id.
   *
   * @throws NotFoundException if there is no such user.
   */
  public async findOne(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`);
    }
    return user;
  }

  /** Applies a partial profile edit and saves it. */
  public async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(userId);
    user.updateProfile(dto);
    return this.users.save(user);
  }

  /** The user's private preferences. */
  public async getPreferences(userId: string): Promise<UserPreferences> {
    return (await this.findOne(userId)).preferences;
  }

  /** Applies a partial preferences edit, saves the user, and returns the new preferences. */
  public async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    const user = await this.findOne(userId);
    user.updatePreferences(dto);
    await this.users.save(user);
    return user.preferences;
  }

  /** The user's saved recipes, skipping any that were deleted or made private since. */
  public async getSavedRecipes(userId: string): Promise<Recipe[]> {
    const user = await this.findOne(userId);
    return this.recipesService.findManyVisibleTo(user.savedRecipeIds, userId);
  }

  /** Saves a recipe the user can see to their list. */
  public async saveRecipe(userId: string, recipeId: string): Promise<User> {
    const user = await this.findOne(userId);
    await this.recipesService.findOne(recipeId, userId); // 404s if missing or private
    user.saveRecipe(recipeId);
    return this.users.save(user);
  }

  /** Removes a recipe from the user's saved list (no error if it was not there). */
  public async unsaveRecipe(userId: string, recipeId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.unsaveRecipe(recipeId);
    return this.users.save(user);
  }
}
