import { BaseEntity, EntityRecord } from '../../common/domain/base.entity';
import { requireBoolean, requireOneOf, requireText } from '../../common/domain/guards';
import { IngredientCategory } from '../../common/domain/ingredient-category';
import { isSameIngredient } from '../../common/domain/ingredient-name';
import { estimateCost } from '../../common/domain/ingredient-pricing';
import { Quantity, QuantityRecord } from '../../common/domain/quantity';
import { ListMember } from './list-member';

/** The fields a grocery item serializes to. */
export interface GroceryListItemSnapshot {
  name: string;
  quantity: Quantity | null;
  category: IngredientCategory;
  purchased: boolean;
  /** Who last added this item (or more of it), shown on shared lists; null if unknown. */
  addedBy: ListMember | null;
  /** Estimated price in US dollars (placeholder prices), or null when the item has no amount. */
  estimatedCost: number | null;
}

/** The fields of an item that can be edited; omitted fields stay unchanged. */
export type GroceryListItemChanges = Partial<
  Omit<GroceryListItemSnapshot, 'addedBy' | 'estimatedCost'>
>;

/** A grocery item's stored state. */
export interface GroceryListItemRecord extends EntityRecord {
  name: string;
  quantity: QuantityRecord | null;
  category: IngredientCategory;
  purchased: boolean;
  addedBy: ListMember | null;
}

/**
 * A line on a grocery list. Only created and changed through its GroceryList,
 * which is the aggregate root, so it is never stored on its own.
 */
export class GroceryListItem extends BaseEntity<GroceryListItemSnapshot> {
  private itemName: string;
  private itemQuantity: Quantity | null;
  private itemCategory: IngredientCategory;
  private isPurchased = false;
  private addedByMember: ListMember | null;

  /** @throws DomainValidationError if the name is blank or the category is unknown. */
  constructor(
    name: string,
    quantity: Quantity | null = null,
    category: IngredientCategory = IngredientCategory.Other,
    addedBy: ListMember | null = null,
  ) {
    super();
    this.itemName = requireText(name, 'Grocery item name');
    this.itemQuantity = quantity;
    this.itemCategory = requireOneOf(category, IngredientCategory, 'category');
    this.addedByMember = addedBy;
  }

  // Read-only views of the item's state; changes go through the methods below.
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

  public get addedBy(): ListMember | null {
    return this.addedByMember;
  }

  /** Estimated price of this item's amount, or null when it has no amount. */
  public get estimatedCost(): number | null {
    return this.itemQuantity === null ? null : estimateCost(this.itemName, this.itemQuantity);
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
  public addQuantity(quantity: Quantity | null, addedBy: ListMember | null = null): void {
    if (quantity !== null) {
      this.itemQuantity = this.itemQuantity === null ? quantity : this.itemQuantity.plus(quantity);
    }
    // Taking it out of the cart reminds the shopper to buy the extra amount.
    this.isPurchased = false;
    this.addedByMember = addedBy ?? this.addedByMember;
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

    // Everything above validated, so apply the changes together.
    this.itemName = name;
    this.itemCategory = category;
    this.isPurchased = purchased;
    if (changes.quantity !== undefined) {
      // Quantity is not re-validated here: it is already a `Quantity` (or null to clear it).
      this.itemQuantity = changes.quantity;
    }
    this.touch();
  }

  /** Rebuilds a stored item, including whether it was bought, with its id and timestamps. */
  public static fromRecord(record: GroceryListItemRecord): GroceryListItem {
    const item = new GroceryListItem(
      record.name,
      Quantity.fromRecordOrNull(record.quantity),
      record.category,
      record.addedBy === null ? null : { ...record.addedBy },
    );
    item.isPurchased = requireBoolean(record.purchased, 'Purchased');
    return item.restoreIdentity(record);
  }

  /** The item's complete state as plain data (see `BaseEntity.toRecord`). */
  public toRecord(): GroceryListItemRecord {
    return {
      ...this.identityRecord(),
      name: this.itemName,
      quantity: this.itemQuantity?.toRecord() ?? null,
      category: this.itemCategory,
      purchased: this.isPurchased,
      addedBy: this.addedByMember === null ? null : { ...this.addedByMember },
    };
  }

  /** The item-specific fields for `toJSON()`. */
  protected snapshot(): GroceryListItemSnapshot {
    return {
      name: this.itemName,
      quantity: this.itemQuantity,
      category: this.itemCategory,
      purchased: this.isPurchased,
      addedBy: this.addedByMember,
      estimatedCost: this.estimatedCost,
    };
  }
}
