import { requireText } from '../../common/domain/guards';
import { isSameIngredient } from '../../common/domain/ingredient-name';
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

  /** True if `name` is the same ingredient and `quantity` can be added to this item's. */
  public canCombineWith(name: string, quantity: Quantity): boolean {
    return isSameIngredient(this.itemName, name) && this.itemQuantity.isCompatibleWith(quantity);
  }

  /** Adds more of this ingredient; the total keeps the unit already held (UC5). */
  public addQuantity(quantity: Quantity): void {
    this.itemQuantity = this.itemQuantity.plus(quantity);
    this.touch();
  }

  protected snapshot(): PantryItemSnapshot {
    return { ownerId: this.ownerId, name: this.itemName, quantity: this.itemQuantity };
  }
}
