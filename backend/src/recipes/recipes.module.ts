import { Module } from '@nestjs/common';
import { InMemoryRecipeRepository } from './repositories/in-memory-recipe.repository';
import { RecipeRepository } from './repositories/recipe.repository';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

/**
 * Recipe feature: routes, service, and storage binding. Exports `RecipesService` so other features
 * (users, grocery lists, the seeder) can look up recipes.
 */
@Module({
  controllers: [RecipesController],
  providers: [
    RecipesService,
    // Swap useClass for a database-backed implementation later.
    { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
  ],
  exports: [RecipesService],
})
export class RecipesModule {}
