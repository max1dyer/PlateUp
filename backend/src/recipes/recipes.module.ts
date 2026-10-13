import { Module } from '@nestjs/common';
import { InMemoryRecipeRepository } from './repositories/in-memory-recipe.repository';
import { RecipeRepository } from './repositories/recipe.repository';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

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
