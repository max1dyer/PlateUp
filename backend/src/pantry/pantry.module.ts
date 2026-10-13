import { Module } from '@nestjs/common';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { InMemoryPantryItemRepository } from './repositories/in-memory-pantry-item.repository';
import { PantryItemRepository } from './repositories/pantry-item.repository';

@Module({
  controllers: [PantryController],
  providers: [
    PantryService,
    { provide: PantryItemRepository, useClass: InMemoryPantryItemRepository },
  ],
  exports: [PantryService],
})
export class PantryModule {}
