import { BaseEntity } from '../../common/domain/base.entity';
import { requireBoolean, requireOneOf, requireText } from '../../common/domain/guards';
import { IngredientCategory } from '../../common/domain/ingredient-category';
import { isSameIngredient } from '../../common/domain/ingredient-name';
import { Quantity } from '../../common/domain/quantity';

export interface GroceryListItemSnapshot {
  name: string;
  quantity: Quantity | null;
  category: IngredientCategory;
  purchased: boolean;
}

/** The fields of an item that can be edited; omitted fields stay unchanged. */
export type GroceryListItemChanges = Partial<GroceryListItemSnapshot>;

/**
 * A line on a grocery list. Only created and changed through its GroceryList,
 * which is the aggregate root, so it is never stored on its own.
 */
export class GroceryListItem extends BaseEntity<GroceryListItemSnapshot> {
  private itemName: string;
  private itemQuantity: Quantity | null;
  private itemCategory: IngredientCategory;
  private isPurchased = false;

  constructor(
    name: string,
    quantity: Quantity | null = null,
    category: IngredientCategory = IngredientCategory.Other,
  ) {
    super();
    this.itemName = requireText(name, 'Grocery item name');
    this.itemQuantity = quantity;
    this.itemCategory = requireOneOf(category, IngredientCategory, 'category');
  }

  public get name(): string {
    return this.itemName;
  }

  public get quantity(): Quantity | null {
    return this.itemQuantity;
  }

  public get category(): IngredientCategory {
    return this.itemCategory;
  }

  public get purchased(): boolean {
    return this.isPurchased;
  }

  /** True if `name` refers to the same ingredient as this item. */
  public isNamed(name: string): boolean {
    return isSameIngredient(this.itemName, name);
  }

  /** True if `quantity` can be added to this item's: compatible units, or either one is missing. */
  public canAddQuantity(quantity: Quantity | null): boolean {
    return (
      quantity === null ||
      this.itemQuantity === null ||
      this.itemQuantity.isCompatibleWith(quantity)
    );
  }

  /**
   * Adds more of this item. The total keeps this item's unit, and the item
   * leaves the cart because more is now needed. Name and category are kept.
   */
  public addQuantity(quantity: Quantity | null): void {
    if (quantity !== null) {
      this.itemQuantity = this.itemQuantity === null ? quantity : this.itemQuantity.plus(quantity);
    }
    this.isPurchased = false;
    this.touch();
  }

  /** Applies a partial edit; every change is validated before any is applied. */
  public update(changes: GroceryListItemChanges): void {
    const name =
      changes.name === undefined ? this.itemName : requireText(changes.name, 'Grocery item name');
    const category =
      changes.category === undefined
        ? this.itemCategory
        : requireOneOf(changes.category, IngredientCategory, 'category');
    const purchased =
      changes.purchased === undefined
        ? this.isPurchased
        : requireBoolean(changes.purchased, 'Purchased');

    this.itemName = name;
    this.itemCategory = category;
    this.isPurchased = purchased;
    if (changes.quantity !== undefined) {
      this.itemQuantity = changes.quantity;
    }
    this.touch();
  }

  protected snapshot(): GroceryListItemSnapshot {
    return {
      name: this.itemName,
      quantity: this.itemQuantity,
      category: this.itemCategory,
      purchased: this.isPurchased,
    };
  }
}
