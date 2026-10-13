import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { Recipe } from '../entities/recipe.entity';
import { RecipeRepository } from './recipe.repository';

@Injectable()
export class InMemoryRecipeRepository
  extends InMemoryRepository<Recipe>
  implements RecipeRepository
{
  public findVisibleTo(userId: string): Promise<Recipe[]> {
    return this.findWhere((recipe) => recipe.isVisibleTo(userId));
  }
}
