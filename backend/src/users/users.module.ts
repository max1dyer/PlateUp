import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * User feature: routes, service, and storage binding. Imports `RecipesModule` to look up saved
 * recipes through `RecipesService`, and exports `UsersService` for the seeder.
 */
@Module({
  imports: [RecipesModule],
  controllers: [UsersController],
  providers: [UsersService, { provide: UserRepository, useClass: InMemoryUserRepository }],
  exports: [UsersService],
})
export class UsersModule {}
