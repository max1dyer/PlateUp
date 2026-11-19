import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { DietaryRestriction, dietaryConflicts } from '../../common/domain/dietary-restriction';
import {
  requireImageSourceOrNull,
  requireNonNegative,
  requirePositiveInteger,
  requireText,
} from '../../common/domain/guards';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { RecipeIngredient } from './recipe-ingredient';
import { RecipeReview } from './recipe-review';

/** Who can see a recipe: everyone, or only its author and the users it was shared with. */
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
  /**
   * The author's own cost per serving in US dollars, or null to estimate it from the ingredients
   * (see `estimatedCostPerServing`).
   */
  costPerServing: number | null;
}

/** Everything a recipe serializes to: its details plus derived review and diet information. */
export interface RecipeSnapshot extends RecipeDetails {
  authorId: string;
  /** Average star rating to one decimal place, or null before the first review. */
  rating: number | null;
  numRatings: number;
  reviews: RecipeReview[];
  /**
   * For each dietary restriction the recipe breaks, the ingredients that
   * break it (an estimate from ingredient names, not allergy advice).
   */
  dietaryConflicts: Partial<Record<DietaryRestriction, string[]>>;
  /** Cost of one serving in US dollars: the author's figure, or else the ingredient estimate. */
  estimatedCostPerServing: number;
  /** True when `estimatedCostPerServing` comes from ingredient prices rather than the author. */
  costIsEstimate: boolean;
}

/** A user-contributed recipe. The owner is the recipe's author. */
export class Recipe extends OwnedEntity<RecipeSnapshot> {
  private details: RecipeDetails;
  /** Keyed by reviewer, so each user has at most one review. */
  private readonly reviewsByUser = new Map<string, RecipeReview>();
  /** Ids of users the author shared this recipe with, so they can see it even if it is private. */
  private readonly sharedWith = new Set<string>();

  /** @throws DomainValidationError if any of the details are invalid (see `validate`). */
  constructor(authorId: string, details: RecipeDetails) {
    super(authorId);
    this.details = Recipe.validate(details);
  }

  /** The author's user id (an alias for `ownerId`). */
  public get authorId(): string {
    return this.ownerId;
  }

  // Read-only views of the recipe's details.
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

  /** A copy of every review, one per reviewer. */
  public get reviews(): RecipeReview[] {
    return [...this.reviewsByUser.values()];
  }

  /** A copy of the ids of the users this recipe is shared with. */
  public get sharedWithIds(): string[] {
    return [...this.sharedWith];
  }

  /** True if the author shared this recipe with `userId`. */
  public isSharedWith(userId: string): boolean {
    return this.sharedWith.has(userId);
  }

  /**
   * Lets `userId` see this recipe even if it is private. Returns false if it was already shared
   * with them.
   *
   * @throws DomainValidationError if `userId` is the author.
   */
  public shareWith(userId: string): boolean {
    if (this.isOwnedBy(userId)) {
      throw new DomainValidationError("You can't share a recipe with yourself.");
    }
    if (this.sharedWith.has(userId)) {
      return false;
    }
    this.sharedWith.add(userId);
    this.touch();
    return true;
  }

  /** Stops sharing with `userId`. Returns false if it was not shared with them. */
  public revokeShare(userId: string): boolean {
    const removed = this.sharedWith.delete(userId);
    if (removed) {
      this.touch();
    }
    return removed;
  }

  /** How many users have reviewed this recipe. */
  public get numRatings(): number {
    return this.reviewsByUser.size;
  }

  /** Average star rating to one decimal place, or null before the first review. */
  public get averageRating(): number | null {
    if (this.reviewsByUser.size === 0) {
      return null;
    }
    // Multiply by 10, round, then divide to keep one decimal place.
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

  /** For each dietary restriction this recipe breaks, the ingredients that break it. */
  public get dietaryConflicts(): Partial<Record<DietaryRestriction, string[]>> {
    return dietaryConflicts(this.details.ingredients.map((ingredient) => ingredient.name));
  }

  /** Whether no ingredient breaks any of `restrictions`. */
  public suits(restrictions: readonly DietaryRestriction[]): boolean {
    const conflicts = this.dietaryConflicts;
    return restrictions.every((restriction) => conflicts[restriction] === undefined);
  }

  /**
   * Cost of one serving in US dollars: the author's `costPerServing` when given, otherwise the
   * sum of the ingredients' estimated prices divided by the servings, to the cent.
   */
  public get estimatedCostPerServing(): number {
    if (this.details.costPerServing !== null) {
      return this.details.costPerServing;
    }
    const total = this.details.ingredients.reduce((sum, item) => sum + item.estimatedCost, 0);
    return Math.round((total / this.details.servings) * 100) / 100;
  }

  /** Whether one serving costs at most `maxCostPerServing` dollars. */
  public fitsBudget(maxCostPerServing: number): boolean {
    return this.estimatedCostPerServing <= maxCostPerServing;
  }

  /** Public recipes are visible to everyone; private ones to their author and who they're shared with. */
  public isVisibleTo(userId: string): boolean {
    return (
      this.details.visibility === RecipeVisibility.Public ||
      this.isOwnedBy(userId) ||
      this.sharedWith.has(userId)
    );
  }

  /** The ingredient list scaled to `servings` (used to generate grocery lists). */
  public ingredientsFor(servings: number): RecipeIngredient[] {
    // The ratio of the wanted servings to the servings the recipe was written for.
    const factor = requirePositiveInteger(servings, 'Servings') / this.details.servings;
    return this.details.ingredients.map((ingredient) => ingredient.scale(factor));
  }

  /**
   * The recipe-specific fields for `toJSON()`, including the derived rating and dietary conflicts.
   */
  protected snapshot(): RecipeSnapshot {
    return {
      authorId: this.ownerId,
      ...this.details,
      rating: this.averageRating,
      numRatings: this.numRatings,
      reviews: this.reviews,
      dietaryConflicts: this.dietaryConflicts,
      estimatedCostPerServing: this.estimatedCostPerServing,
      costIsEstimate: this.details.costPerServing === null,
    };
  }

  /**
   * Checks every field and returns a cleaned-up copy (trimmed text, de-duplicated tags).
   *
   * @throws DomainValidationError naming the first invalid field.
   */
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
      thumbnailUrl: requireImageSourceOrNull(details.thumbnailUrl, 'Photo'),
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
      costPerServing: Recipe.validateCost(details.costPerServing),
    };
  }

  /** Null (estimate it) or a non-negative dollar amount, rounded to the cent. */
  private static validateCost(cost: number | null | undefined): number | null {
    if (cost === null || cost === undefined) {
      return null;
    }
    return Math.round(requireNonNegative(cost, 'Cost per serving') * 100) / 100;
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
