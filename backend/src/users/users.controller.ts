import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Recipe } from '../recipes/entities/recipe.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  public register(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.register(dto);
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
