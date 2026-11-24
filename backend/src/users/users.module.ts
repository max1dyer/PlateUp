import { repositoryProvider, StorageModule } from '../common/persistence/storage.module';
import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { PostgresUserRepository } from './repositories/postgres-user.repository';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * User feature: routes, service, and storage binding. Imports `RecipesModule` to look up saved
 * recipes through `RecipesService`, and exports `UsersService` for the seeder.
 */
@Module({
  imports: [StorageModule, RecipesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    repositoryProvider(UserRepository, InMemoryUserRepository, PostgresUserRepository),
  ],
  exports: [UsersService],
})
export class UsersModule {}
