import { Module } from '@nestjs/common';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { InMemoryPantryItemRepository } from './repositories/in-memory-pantry-item.repository';
import { PantryItemRepository } from './repositories/pantry-item.repository';

/**
 * Pantry feature: routes, service, and storage binding. Exports `PantryService` so grocery lists
 * can move purchased items into the pantry.
 */
@Module({
  controllers: [PantryController],
  providers: [
    PantryService,
    { provide: PantryItemRepository, useClass: InMemoryPantryItemRepository },
  ],
  exports: [PantryService],
})
export class PantryModule {}
