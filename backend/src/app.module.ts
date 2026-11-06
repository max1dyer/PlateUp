import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactModule } from './contact/contact.module';
import { DomainErrorFilter } from './common/filters/domain-error.filter';
import { GroceryListsModule } from './grocery-lists/grocery-lists.module';
import { PantryModule } from './pantry/pantry.module';
import { RecipesModule } from './recipes/recipes.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UsersModule,
    RecipesModule,
    PantryModule,
    GroceryListsModule,
    ContactModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
