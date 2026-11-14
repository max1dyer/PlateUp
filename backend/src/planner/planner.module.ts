import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { UsersModule } from '../users/users.module';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { InMemoryPlannedMealRepository } from './repositories/in-memory-planned-meal.repository';
import { PlannedMealRepository } from './repositories/planned-meal.repository';

/**
 * Weekly planner feature. Imports `RecipesModule` (to check and summarize
 * planned recipes) and `UsersModule` (for the preferred serving size), and
 * exports `PlannerService` so other features can read a week's meals.
 */
@Module({
  imports: [RecipesModule, UsersModule],
  controllers: [PlannerController],
  providers: [
    PlannerService,
    // Swap useClass for a database-backed implementation later.
    { provide: PlannedMealRepository, useClass: InMemoryPlannedMealRepository },
  ],
  exports: [PlannerService],
})
export class PlannerModule {}
