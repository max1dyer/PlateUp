import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Recipe } from '../recipes/entities/recipe.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LogInDto } from './dto/log-in.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences';
import { UsersService } from './users.service';

/**
 * HTTP routes under `/users` for accounts, profiles, preferences, and saved recipes. Routes under
 * `me` act on the signed-in user (from the `x-user-id` header).
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** `POST /users`: creates an account; 409 if the username is taken. */
  @Post()
  public register(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.register(dto);
  }

  /** TEMPORARY: username-only sign-in until Supabase authentication exists. */
  @Post('login')
  @HttpCode(200)
  public logIn(@Body() dto: LogInDto): Promise<User> {
    return this.usersService.logIn(dto);
  }

  // `me` routes are declared before `:userId` so "me" is not treated as an id.
  /** `GET /users/me`: the signed-in user's own profile. */
  @Get('me')
  public findMe(@CurrentUserId() userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  /** `PATCH /users/me`: edits the signed-in user's profile. */
  @Patch('me')
  public updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.updateProfile(userId, dto);
  }

  /** Private to the signed-in user, so it is not part of the public profile. */
  @Get('me/preferences')
  public getPreferences(@CurrentUserId() userId: string): Promise<UserPreferences> {
    return this.usersService.getPreferences(userId);
  }

  /** `PATCH /users/me/preferences`: edits the signed-in user's preferences. */
  @Patch('me/preferences')
  public updatePreferences(
    @CurrentUserId() userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    return this.usersService.updatePreferences(userId, dto);
  }

  /** `GET /users/me/saved-recipes`: the saved recipes the user can still see. */
  @Get('me/saved-recipes')
  public getSavedRecipes(@CurrentUserId() userId: string): Promise<Recipe[]> {
    return this.usersService.getSavedRecipes(userId);
  }

  /** `PUT /users/me/saved-recipes/:recipeId`: saves a recipe; 404 if the user cannot see it. */
  @Put('me/saved-recipes/:recipeId')
  public saveRecipe(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<User> {
    return this.usersService.saveRecipe(userId, recipeId);
  }

  /** `DELETE /users/me/saved-recipes/:recipeId`: removes a recipe from the saved list. */
  @Delete('me/saved-recipes/:recipeId')
  public unsaveRecipe(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<User> {
    return this.usersService.unsaveRecipe(userId, recipeId);
  }

  /** `GET /users/:userId`: anyone's public profile. */
  @Get(':userId')
  public findOne(@Param('userId') userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }
}
