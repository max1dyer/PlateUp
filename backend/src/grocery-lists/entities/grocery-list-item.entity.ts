import { BaseEntity } from '../../common/domain/base.entity';
import { requireBoolean, requireText } from '../../common/domain/guards';
import { Quantity } from '../../common/domain/quantity';

export interface GroceryListItemSnapshot {
  name: string;
  quantity: Quantity | null;
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
  private isPurchased = false;

  constructor(name: string, quantity: Quantity | null = null) {
    super();
    this.itemName = requireText(name, 'Grocery item name');
    this.itemQuantity = quantity;
  }

  public get name(): string {
    return this.itemName;
  }

  public get quantity(): Quantity | null {
    return this.itemQuantity;
  }

  public get purchased(): boolean {
    return this.isPurchased;
  }

  /** Applies a partial edit; every change is validated before any is applied. */
  public update(changes: GroceryListItemChanges): void {
    const name =
      changes.name === undefined ? this.itemName : requireText(changes.name, 'Grocery item name');
    const purchased =
      changes.purchased === undefined
        ? this.isPurchased
        : requireBoolean(changes.purchased, 'Purchased');

    this.itemName = name;
    this.isPurchased = purchased;
    if (changes.quantity !== undefined) {
      this.itemQuantity = changes.quantity;
    }
    this.touch();
  }

  protected snapshot(): GroceryListItemSnapshot {
    return { name: this.itemName, quantity: this.itemQuantity, purchased: this.isPurchased };
  }
}
