import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { DomainErrorFilter } from './common/filters/domain-error.filter';
import { GroceryListsModule } from './grocery-lists/grocery-lists.module';
import { RecipeSharesModule } from './recipe-shares/recipe-shares.module';
import { PantryModule } from './pantry/pantry.module';
import { PlannerModule } from './planner/planner.module';
import { RecipesModule } from './recipes/recipes.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

/**
 * Root module. Pulls in every feature module (with `AuthModule`, which guards every route) and
 * registers `DomainErrorFilter` globally (through the `APP_FILTER` token) so any
 * `DomainValidationError` thrown by an entity becomes an HTTP 400.
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    RecipesModule,
    PantryModule,
    NotificationsModule,
    GroceryListsModule,
    RecipeSharesModule,
    PlannerModule,
    ContactModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
