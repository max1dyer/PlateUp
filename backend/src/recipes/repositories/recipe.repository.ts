import { Repository } from '../../common/persistence/repository';
import { Recipe } from '../entities/recipe.entity';

/** DI token and contract for recipe storage. */
export abstract class RecipeRepository extends Repository<Recipe> {
  /** Public recipes plus the given user's own private ones. */
  public abstract findVisibleTo(userId: string): Promise<Recipe[]>;
}
