import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RecipeVisibility } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { InMemoryRecipeRepository } from '../recipes/repositories/in-memory-recipe.repository';
import { RecipeRepository } from '../recipes/repositories/recipe.repository';
import { buildCreateRecipeDto } from '../recipes/testing/recipe.fixtures';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserRepository } from './repositories/user.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let recipes: RecipesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        RecipesService,
        { provide: UserRepository, useClass: InMemoryUserRepository },
        { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
    recipes = moduleRef.get(RecipesService);
  });

  it('register creates a user with default profile fields', async () => {
    const user = await service.register({ username: 'Peter', displayName: 'Peter Jones' });

    expect(user.toJSON()).toMatchObject({
      username: 'peter',
      displayName: 'Peter Jones',
      bio: '',
      profilePictureUrl: null,
    });
  });

  it('register rejects a taken username regardless of case', async () => {
    await service.register({ username: 'peter', displayName: 'Peter' });

    await expect(service.register({ username: 'PETER', displayName: 'Other' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('findOne 404s for unknown users', async () => {
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('updateProfile edits the profile', async () => {
    const user = await service.register({ username: 'peter', displayName: 'Peter' });

    const updated = await service.updateProfile(user.id, { bio: 'Gym and physics.' });

    expect(updated.toJSON().bio).toBe('Gym and physics.');
  });

  it('saveRecipe, getSavedRecipes and unsaveRecipe manage saved recipes', async () => {
    const user = await service.register({ username: 'peter', displayName: 'Peter' });
    const recipe = await recipes.create('chef', buildCreateRecipeDto());

    await service.saveRecipe(user.id, recipe.id);
    expect(await service.getSavedRecipes(user.id)).toEqual([recipe]);

    await service.unsaveRecipe(user.id, recipe.id);
    expect(await service.getSavedRecipes(user.id)).toEqual([]);
  });

  it('saveRecipe 404s for a private recipe the user cannot see', async () => {
    const user = await service.register({ username: 'peter', displayName: 'Peter' });
    const recipe = await recipes.create(
      'chef',
      buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
    );

    await expect(service.saveRecipe(user.id, recipe.id)).rejects.toThrow(NotFoundException);
  });
});
