import { Module } from '@nestjs/common';
import { GroceryListsController } from './grocery-lists.controller';
import { GroceryListsService } from './grocery-lists.service';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { InMemoryGroceryListRepository } from './repositories/in-memory-grocery-list.repository';

@Module({
  controllers: [GroceryListsController],
  providers: [
    GroceryListsService,
    { provide: GroceryListRepository, useClass: InMemoryGroceryListRepository },
  ],
  exports: [GroceryListsService],
})
export class GroceryListsModule {}
