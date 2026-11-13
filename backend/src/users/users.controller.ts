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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  @Get('me')
  public findMe(@CurrentUserId() userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  public updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.updateProfile(userId, dto);
  }

  /** Private to the signed-in user, so it is not part of the public profile. */
  @Get('me/preferences')
  public getPreferences(@CurrentUserId() userId: string): Promise<UserPreferences> {
    return this.usersService.getPreferences(userId);
  }

  @Patch('me/preferences')
  public updatePreferences(
    @CurrentUserId() userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    return this.usersService.updatePreferences(userId, dto);
  }

  @Get('me/saved-recipes')
  public getSavedRecipes(@CurrentUserId() userId: string): Promise<Recipe[]> {
    return this.usersService.getSavedRecipes(userId);
  }

  @Put('me/saved-recipes/:recipeId')
  public saveRecipe(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<User> {
    return this.usersService.saveRecipe(userId, recipeId);
  }

  @Delete('me/saved-recipes/:recipeId')
  public unsaveRecipe(
    @CurrentUserId() userId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<User> {
    return this.usersService.unsaveRecipe(userId, recipeId);
  }

  @Get(':userId')
  public findOne(@Param('userId') userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }
}
