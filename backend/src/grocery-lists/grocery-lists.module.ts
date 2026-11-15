import { Module } from '@nestjs/common';
import { PantryModule } from '../pantry/pantry.module';
import { RecipesModule } from '../recipes/recipes.module';
import { GroceryListsController } from './grocery-lists.controller';
import { GroceryListsService } from './grocery-lists.service';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { InMemoryGroceryListRepository } from './repositories/in-memory-grocery-list.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

/**
 * Grocery list feature. Imports `RecipesModule` (to add a recipe's ingredients) and `PantryModule`
 * (to move purchased items into the pantry).
 */
@Module({
  imports: [RecipesModule, PantryModule, NotificationsModule, UsersModule],
  controllers: [GroceryListsController],
  providers: [
    GroceryListsService,
    { provide: GroceryListRepository, useClass: InMemoryGroceryListRepository },
  ],
  exports: [GroceryListsService],
})
export class GroceryListsModule {}
