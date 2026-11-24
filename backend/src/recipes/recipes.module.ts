import { repositoryProvider, StorageModule } from '../common/persistence/storage.module';
import { Module } from '@nestjs/common';
import { PostgresRecipeRepository } from './repositories/postgres-recipe.repository';
import { InMemoryRecipeRepository } from './repositories/in-memory-recipe.repository';
import { RecipeRepository } from './repositories/recipe.repository';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

/**
 * Recipe feature: routes, service, and storage binding. Exports `RecipesService` so other features
 * (users, grocery lists, the seeder) can look up recipes.
 */
@Module({
  imports: [StorageModule],
  controllers: [RecipesController],
  providers: [
    RecipesService,
    repositoryProvider(RecipeRepository, InMemoryRecipeRepository, PostgresRecipeRepository),
  ],
  exports: [RecipesService],
})
export class RecipesModule {}
