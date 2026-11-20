import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { AuthConfig } from '../auth/auth-config';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Recipe } from '../recipes/entities/recipe.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LogInDto } from './dto/log-in.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences';
import { UsersService } from './users.service';

/**
 * HTTP routes under `/users` for accounts, profiles, preferences, and saved recipes. Routes under
 * `me` act on the signed-in user (see `@CurrentUserId()`).
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authConfig: AuthConfig,
  ) {}

  /**
   * `POST /users`: development sign-up by username; 409 if the username is taken. Refused (403)
   * once Supabase is configured, since such an account could never sign in.
   */
  @Post()
  public register(@Body() dto: CreateUserDto): Promise<User> {
    this.requireDevelopmentSignIn();
    return this.usersService.register(dto);
  }

  /** `POST /users/login`: development sign-in by username; refused (403) with Supabase. */
  @Post('login')
  @HttpCode(200)
  public logIn(@Body() dto: LogInDto): Promise<User> {
    this.requireDevelopmentSignIn();
    return this.usersService.logIn(dto);
  }

  /**
   * `POST /users/me`: creates the profile for the signed-in Supabase account; 409 if it already
   * has one or the username is taken.
   */
  @Post('me')
  public createProfile(
    @CurrentUserId() userId: string,
    @Body() dto: CreateProfileDto,
  ): Promise<User> {
    return this.usersService.createProfile(userId, dto);
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

  /** Username-only sign-in would let anyone act as anyone, so it is off once Supabase is set up. */
  private requireDevelopmentSignIn(): void {
    if (this.authConfig.usesSupabase) {
      throw new ForbiddenException('Sign in with your email and password.');
    }
  }

  /** `GET /users/:userId`: anyone's public profile. */
  @Get(':userId')
  public findOne(@Param('userId') userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }
}
