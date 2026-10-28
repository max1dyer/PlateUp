import { DomainValidationError } from '../../common/errors/domain-validation.error';
import {
  requireNonNegative,
  requirePositiveInteger,
  requireText,
} from '../../common/domain/guards';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { RecipeIngredient } from './recipe-ingredient';
import { RecipeReview } from './recipe-review';

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
  /** Cuisine and mood labels such as "Italian" or "Comfort Food". */
  tags: string[];
}

export interface RecipeSnapshot extends RecipeDetails {
  authorId: string;
  /** Average star rating to one decimal place, or null before the first review. */
  rating: number | null;
  numRatings: number;
  reviews: RecipeReview[];
}

/** A user-contributed recipe. The owner is the recipe's author. */
export class Recipe extends OwnedEntity<RecipeSnapshot> {
  private details: RecipeDetails;
  /** Keyed by reviewer, so each user has at most one review. */
  private readonly reviewsByUser = new Map<string, RecipeReview>();

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

  public get tags(): readonly string[] {
    return this.details.tags;
  }

  public get reviews(): RecipeReview[] {
    return [...this.reviewsByUser.values()];
  }

  public get numRatings(): number {
    return this.reviewsByUser.size;
  }

  /** Average star rating to one decimal place, or null before the first review. */
  public get averageRating(): number | null {
    if (this.reviewsByUser.size === 0) {
      return null;
    }
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / this.reviewsByUser.size) * 10) / 10;
  }

  /** Applies a partial edit; the result is validated as a whole. */
  public update(changes: Partial<RecipeDetails>): void {
    this.details = Recipe.validate({ ...this.details, ...changes });
    this.touch();
  }

  /**
   * Records `reviewerId`'s rating, replacing their earlier review if they have one.
   * Throws if the reviewer is the author or the rating is not 1–5.
   */
  public review(reviewerId: string, rating: number, comment: string): RecipeReview {
    if (this.isOwnedBy(reviewerId)) {
      throw new DomainValidationError('Authors cannot review their own recipes.');
    }
    const review = new RecipeReview(reviewerId, rating, comment);
    this.reviewsByUser.set(review.reviewerId, review);
    this.touch();
    return review;
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
    return {
      authorId: this.ownerId,
      ...this.details,
      rating: this.averageRating,
      numRatings: this.numRatings,
      reviews: this.reviews,
    };
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
      tags: Recipe.validateTags(details.tags),
    };
  }

  /** Trims tags and drops repeats that differ only in case, keeping the first spelling. */
  private static validateTags(tags: string[]): string[] {
    const seen = new Set<string>();
    return tags
      .map((tag) => requireText(tag, 'Tag'))
      .filter((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }
}
