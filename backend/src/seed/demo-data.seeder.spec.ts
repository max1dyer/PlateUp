import { Test } from '@nestjs/testing';
import { RecipesService } from '../recipes/recipes.service';
import { InMemoryRecipeRepository } from '../recipes/repositories/in-memory-recipe.repository';
import { RecipeRepository } from '../recipes/repositories/recipe.repository';
import { InMemoryUserRepository } from '../users/repositories/in-memory-user.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { DemoDataSeeder } from './demo-data.seeder';

describe('DemoDataSeeder', () => {
  it('creates a public recipe with a review that any user can see', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DemoDataSeeder,
        UsersService,
        RecipesService,
        { provide: UserRepository, useClass: InMemoryUserRepository },
        { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
      ],
    }).compile();

    await moduleRef.get(DemoDataSeeder).onApplicationBootstrap();

    const [recipe] = await moduleRef.get(RecipesService).findAllVisibleTo('anyone');
    const author = await moduleRef.get(UsersService).findOne(recipe.authorId);
    expect(author.displayName).toBe('Demo Chef');
    expect(recipe.numRatings).toBe(1);
    expect(recipe.tags.length).toBeGreaterThan(0);
  });
});
