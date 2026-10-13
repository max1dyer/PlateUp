import { BaseEntity } from '../../common/domain/base.entity';
import { requireText } from '../../common/domain/guards';
import { Quantity } from '../../common/domain/quantity';

export interface GroceryListItemSnapshot {
  name: string;
  quantity: Quantity | null;
  purchased: boolean;
}

/**
 * A line on a grocery list. Only created and changed through its GroceryList,
 * which is the aggregate root, so it is never stored on its own.
 */
export class GroceryListItem extends BaseEntity<GroceryListItemSnapshot> {
  public readonly name: string;
  private isPurchased = false;

  constructor(
    name: string,
    public readonly quantity: Quantity | null = null,
  ) {
    super();
    this.name = requireText(name, 'Grocery item name');
  }

  public get purchased(): boolean {
    return this.isPurchased;
  }

  public setPurchased(purchased: boolean): void {
    this.isPurchased = purchased;
    this.touch();
  }

  protected snapshot(): GroceryListItemSnapshot {
    return { name: this.name, quantity: this.quantity, purchased: this.isPurchased };
  }
}
