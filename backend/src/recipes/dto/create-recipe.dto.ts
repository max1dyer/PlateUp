import { QuantityDto } from '../../common/dto/quantity.dto';
import { NutritionInfo, RecipeVisibility } from '../entities/recipe.entity';

/** Request-body shape of one ingredient line: a free-text name and an amount. */
export class RecipeIngredientDto {
  public readonly name!: string;
  public readonly quantity!: QuantityDto;
}

/**
 * Body of `POST /recipes`. Optional fields get defaults in `RecipesService.create`, and the
 * `Recipe` entity validates everything.
 */
export class CreateRecipeDto {
  public readonly title!: string;
  public readonly description?: string;
  public readonly thumbnailUrl?: string;
  public readonly servings!: number;
  public readonly prepTimeMinutes!: number;
  public readonly ingredients!: RecipeIngredientDto[];
  public readonly steps!: string[];
  public readonly nutrition!: NutritionInfo;
  public readonly visibility?: RecipeVisibility;
  public readonly tags?: string[];
}
