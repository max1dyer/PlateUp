import { Injectable } from '@nestjs/common';
import { Database } from '../../common/persistence/database';
import { PostgresRepository } from '../../common/persistence/postgres.repository';
import { Recipe, RecipeRecord } from '../entities/recipe.entity';
import { RecipeRepository } from './recipe.repository';

/** `RecipeRepository` backed by PostgreSQL (the "recipes" collection in `entity_records`). */
@Injectable()
export class PostgresRecipeRepository
  extends PostgresRepository<Recipe, RecipeRecord>
  implements RecipeRepository
{
  /** @param database - The connection `StorageModule` provides. */
  constructor(database: Database) {
    super(database, 'recipes', (record) => Recipe.fromRecord(record));
  }

  /** Public recipes, the user's own, and recipes shared with them. */
  public findVisibleTo(userId: string): Promise<Recipe[]> {
    return this.findWhere((recipe) => recipe.isVisibleTo(userId));
  }
}
