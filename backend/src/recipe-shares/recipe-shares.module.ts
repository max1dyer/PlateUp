import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecipesModule } from '../recipes/recipes.module';
import { UsersModule } from '../users/users.module';
import { RecipeSharesController } from './recipe-shares.controller';
import { RecipeSharesService } from './recipe-shares.service';

/**
 * Sharing recipes with specific users. Sits on top of the recipes, users and notifications
 * modules, so none of them has to depend on another.
 */
@Module({
  imports: [RecipesModule, UsersModule, NotificationsModule],
  controllers: [RecipeSharesController],
  providers: [RecipeSharesService],
})
export class RecipeSharesModule {}
