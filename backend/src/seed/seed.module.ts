import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { UsersModule } from '../users/users.module';
import { DemoDataSeeder } from './demo-data.seeder';

/** Loads the demo author and recipes on first start; see `DemoDataSeeder`. */
@Module({
  imports: [UsersModule, RecipesModule],
  providers: [DemoDataSeeder],
})
export class SeedModule {}
