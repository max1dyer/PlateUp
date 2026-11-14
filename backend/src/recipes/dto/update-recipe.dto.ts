import { NutritionInfo, RecipeVisibility } from '../entities/recipe.entity';
import { RecipeIngredientDto } from './create-recipe.dto';

/**
 * Body of `PATCH /recipes/:recipeId`. Omitted fields stay unchanged; `thumbnailUrl: null` removes
 * the photo.
 */
export class UpdateRecipeDto {
  public readonly title?: string;
  public readonly description?: string;
  public readonly thumbnailUrl?: string | null;
  public readonly servings?: number;
  public readonly prepTimeMinutes?: number;
  public readonly ingredients?: RecipeIngredientDto[];
  public readonly steps?: string[];
  public readonly nutrition?: NutritionInfo;
  public readonly visibility?: RecipeVisibility;
  public readonly tags?: string[];
}
