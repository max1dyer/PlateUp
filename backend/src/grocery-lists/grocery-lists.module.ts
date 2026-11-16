import { Module } from '@nestjs/common';
import { PantryModule } from '../pantry/pantry.module';
import { PlannerModule } from '../planner/planner.module';
import { RecipesModule } from '../recipes/recipes.module';
import { GroceryListsController } from './grocery-lists.controller';
import { GroceryListsService } from './grocery-lists.service';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { InMemoryGroceryListRepository } from './repositories/in-memory-grocery-list.repository';

/**
 * Grocery list feature. Imports `RecipesModule` (to add a recipe's ingredients), `PantryModule`
 * (to move purchased items into the pantry and allow for what it holds), and `PlannerModule` (to
 * shop for a planned week).
 */
@Module({
  imports: [RecipesModule, PantryModule, PlannerModule],
  controllers: [GroceryListsController],
  providers: [
    GroceryListsService,
    { provide: GroceryListRepository, useClass: InMemoryGroceryListRepository },
  ],
  exports: [GroceryListsService],
})
export class GroceryListsModule {}
