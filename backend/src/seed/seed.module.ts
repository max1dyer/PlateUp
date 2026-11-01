import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { UsersModule } from '../users/users.module';
import { DemoDataSeeder } from './demo-data.seeder';

/** TEMPORARY: loads sample data into the in-memory store; see `DemoDataSeeder`. */
@Module({
  imports: [UsersModule, RecipesModule],
  providers: [DemoDataSeeder],
})
export class SeedModule {}
