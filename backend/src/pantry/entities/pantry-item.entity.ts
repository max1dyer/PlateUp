import { requireText } from '../../common/domain/guards';
import { isSameIngredient } from '../../common/domain/ingredient-name';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Quantity } from '../../common/domain/quantity';

/** The fields a pantry item serializes to. */
export interface PantryItemSnapshot {
  ownerId: string;
  name: string;
  quantity: Quantity;
}

/** An ingredient the user has on hand. */
export class PantryItem extends OwnedEntity<PantryItemSnapshot> {
  private itemName: string;
  private itemQuantity: Quantity;

  /** @throws DomainValidationError if the name is blank. */
  constructor(ownerId: string, name: string, quantity: Quantity) {
    super(ownerId);
    this.itemName = requireText(name, 'Pantry item name');
    this.itemQuantity = quantity;
  }

  /** The ingredient's name as the user entered it. */
  public get name(): string {
    return this.itemName;
  }

  /** How much of the ingredient the user has. */
  public get quantity(): Quantity {
    return this.itemQuantity;
  }

  /** Renames the item; the name may not be blank. */
  public rename(name: string): void {
    this.itemName = requireText(name, 'Pantry item name');
    this.touch();
  }

  /** Replaces the amount on hand (in any unit). */
  public setQuantity(quantity: Quantity): void {
    this.itemQuantity = quantity;
    this.touch();
  }

  /** True if `name` refers to the same ingredient as this item. */
  public isNamed(name: string): boolean {
    return isSameIngredient(this.itemName, name);
  }

  /** True if `quantity` is in a unit that can be added to this item's. */
  public canAddQuantity(quantity: Quantity): boolean {
    return this.itemQuantity.isCompatibleWith(quantity);
  }

  /** Adds more of this ingredient; the total keeps the unit already held (UC5). */
  public addQuantity(quantity: Quantity): void {
    this.itemQuantity = this.itemQuantity.plus(quantity);
    this.touch();
  }

  /** The pantry-specific fields for `toJSON()`. */
  protected snapshot(): PantryItemSnapshot {
    return { ownerId: this.ownerId, name: this.itemName, quantity: this.itemQuantity };
  }
}
