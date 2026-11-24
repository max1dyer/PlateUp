import { repositoryProvider, StorageModule } from '../common/persistence/storage.module';
import { Module } from '@nestjs/common';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { PostgresPantryItemRepository } from './repositories/postgres-pantry-item.repository';
import { InMemoryPantryItemRepository } from './repositories/in-memory-pantry-item.repository';
import { PantryItemRepository } from './repositories/pantry-item.repository';

/**
 * Pantry feature: routes, service, and storage binding. Exports `PantryService` so grocery lists
 * can move purchased items into the pantry.
 */
@Module({
  imports: [StorageModule],
  controllers: [PantryController],
  providers: [
    PantryService,
    repositoryProvider(
      PantryItemRepository,
      InMemoryPantryItemRepository,
      PostgresPantryItemRepository,
    ),
  ],
  exports: [PantryService],
})
export class PantryModule {}
