import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { Recipe } from '../entities/recipe.entity';
import { RecipeRepository } from './recipe.repository';

/** `RecipeRepository` backed by an in-memory map (data is lost on restart). */
@Injectable()
export class InMemoryRecipeRepository
  extends InMemoryRepository<Recipe>
  implements RecipeRepository
{
  /** Public recipes plus the given user's own private ones. */
  public findVisibleTo(userId: string): Promise<Recipe[]> {
    return this.findWhere((recipe) => recipe.isVisibleTo(userId));
  }
}
