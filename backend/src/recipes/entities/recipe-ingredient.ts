import { requireText } from '../../common/domain/guards';
import { estimateCost } from '../../common/domain/ingredient-pricing';
import { Quantity } from '../../common/domain/quantity';

/** One line of a recipe's ingredient list. Immutable value object. */
export class RecipeIngredient {
  public readonly name: string;
  /** Estimated cost in US dollars of this amount (placeholder prices, see `estimateCost`). */
  public readonly estimatedCost: number;

  /** @throws DomainValidationError if the name is blank. */
  constructor(
    name: string,
    public readonly quantity: Quantity,
  ) {
    this.name = requireText(name, 'Ingredient name');
    this.estimatedCost = estimateCost(this.name, quantity);
  }

  /** Returns a copy with the amount multiplied by `factor` (e.g. 2 when doubling the servings). */
  public scale(factor: number): RecipeIngredient {
    return new RecipeIngredient(this.name, this.quantity.scale(factor));
  }
}
