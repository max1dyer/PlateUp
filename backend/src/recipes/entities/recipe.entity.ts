import { DomainValidationError } from '../../common/errors/domain-validation.error';
import {
  requireNonNegative,
  requirePositiveInteger,
  requireText,
} from '../../common/domain/guards';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { RecipeIngredient } from './recipe-ingredient';

export enum RecipeVisibility {
  Public = 'public',
  Private = 'private',
}

/** Nutrition for a single serving. */
export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

/** The author-editable content of a recipe. */
export interface RecipeDetails {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  servings: number;
  prepTimeMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  nutrition: NutritionInfo;
  visibility: RecipeVisibility;
}

export interface RecipeSnapshot extends RecipeDetails {
  authorId: string;
}

/** A user-contributed recipe. The owner is the recipe's author. */
export class Recipe extends OwnedEntity<RecipeSnapshot> {
  private details: RecipeDetails;

  constructor(authorId: string, details: RecipeDetails) {
    super(authorId);
    this.details = Recipe.validate(details);
  }

  public get authorId(): string {
    return this.ownerId;
  }

  public get title(): string {
    return this.details.title;
  }

  public get servings(): number {
    return this.details.servings;
  }

  public get visibility(): RecipeVisibility {
    return this.details.visibility;
  }

  public get ingredients(): readonly RecipeIngredient[] {
    return this.details.ingredients;
  }

  public get steps(): readonly string[] {
    return this.details.steps;
  }

  /** Applies a partial edit; the result is validated as a whole. */
  public update(changes: Partial<RecipeDetails>): void {
    this.details = Recipe.validate({ ...this.details, ...changes });
    this.touch();
  }

  public isVisibleTo(userId: string): boolean {
    return this.details.visibility === RecipeVisibility.Public || this.isOwnedBy(userId);
  }

  /** The ingredient list scaled to `servings` (used to generate grocery lists). */
  public ingredientsFor(servings: number): RecipeIngredient[] {
    const factor = requirePositiveInteger(servings, 'Servings') / this.details.servings;
    return this.details.ingredients.map((ingredient) => ingredient.scale(factor));
  }

  protected snapshot(): RecipeSnapshot {
    return { authorId: this.ownerId, ...this.details };
  }

  private static validate(details: RecipeDetails): RecipeDetails {
    if (details.ingredients.length === 0) {
      throw new DomainValidationError('A recipe needs at least one ingredient.');
    }
    if (!Object.values(RecipeVisibility).includes(details.visibility)) {
      throw new DomainValidationError(`Unknown visibility "${String(details.visibility)}".`);
    }
    const steps = details.steps.map((step, index) => requireText(step, `Step ${index + 1}`));
    if (steps.length === 0) {
      throw new DomainValidationError('A recipe needs at least one step.');
    }
    return {
      ...details,
      title: requireText(details.title, 'Title'),
      description: details.description.trim(),
      servings: requirePositiveInteger(details.servings, 'Servings'),
      prepTimeMinutes: requireNonNegative(details.prepTimeMinutes, 'Prep time'),
      steps,
      nutrition: {
        calories: requireNonNegative(details.nutrition.calories, 'Calories'),
        protein: requireNonNegative(details.nutrition.protein, 'Protein'),
        fat: requireNonNegative(details.nutrition.fat, 'Fat'),
        carbohydrates: requireNonNegative(details.nutrition.carbohydrates, 'Carbohydrates'),
      },
    };
  }
}
