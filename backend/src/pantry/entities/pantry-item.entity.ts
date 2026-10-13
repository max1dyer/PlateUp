import { requireText } from '../../common/domain/guards';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Quantity } from '../../common/domain/quantity';

export interface PantryItemSnapshot {
  ownerId: string;
  name: string;
  quantity: Quantity;
}

/** An ingredient the user has on hand. */
export class PantryItem extends OwnedEntity<PantryItemSnapshot> {
  private itemName: string;
  private itemQuantity: Quantity;

  constructor(ownerId: string, name: string, quantity: Quantity) {
    super(ownerId);
    this.itemName = requireText(name, 'Pantry item name');
    this.itemQuantity = quantity;
  }

  public get name(): string {
    return this.itemName;
  }

  public get quantity(): Quantity {
    return this.itemQuantity;
  }

  public rename(name: string): void {
    this.itemName = requireText(name, 'Pantry item name');
    this.touch();
  }

  public setQuantity(quantity: Quantity): void {
    this.itemQuantity = quantity;
    this.touch();
  }

  protected snapshot(): PantryItemSnapshot {
    return { ownerId: this.ownerId, name: this.itemName, quantity: this.itemQuantity };
  }
}
