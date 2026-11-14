import { requireCalendarDateOrNull } from '../../common/domain/calendar-date';
import { requireText } from '../../common/domain/guards';
import { isSameIngredient } from '../../common/domain/ingredient-name';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Quantity } from '../../common/domain/quantity';

/** The fields a pantry item serializes to. */
export interface PantryItemSnapshot {
  ownerId: string;
  name: string;
  quantity: Quantity;
  /** Day the item expires (`YYYY-MM-DD`), or null if the user gave none. */
  expiresOn: string | null;
}

/** An ingredient the user has on hand. */
export class PantryItem extends OwnedEntity<PantryItemSnapshot> {
  private itemName: string;
  private itemQuantity: Quantity;
  private expiry: string | null;

  /** @throws DomainValidationError if the name is blank or the expiration date is invalid. */
  constructor(ownerId: string, name: string, quantity: Quantity, expiresOn: string | null = null) {
    super(ownerId);
    this.itemName = requireText(name, 'Pantry item name');
    this.itemQuantity = quantity;
    this.expiry = requireCalendarDateOrNull(expiresOn, 'Expiration date');
  }

  /** The ingredient's name as the user entered it. */
  public get name(): string {
    return this.itemName;
  }

  /** How much of the ingredient the user has. */
  public get quantity(): Quantity {
    return this.itemQuantity;
  }

  /** Day the item expires (`YYYY-MM-DD`), or null if unknown. */
  public get expiresOn(): string | null {
    return this.expiry;
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

  /** Sets or (with null) clears the expiration date. */
  public setExpiresOn(expiresOn: string | null): void {
    this.expiry = requireCalendarDateOrNull(expiresOn, 'Expiration date');
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

  /**
   * Adds more of this ingredient; the total keeps the unit already held (UC5).
   * If the new amount has an expiration date, the item keeps the earlier of
   * the two dates, so the alert covers the part that goes off first.
   */
  public addQuantity(quantity: Quantity, expiresOn: string | null = null): void {
    const added = requireCalendarDateOrNull(expiresOn, 'Expiration date');
    this.itemQuantity = this.itemQuantity.plus(quantity);
    // YYYY-MM-DD strings compare in date order.
    if (added !== null && (this.expiry === null || added < this.expiry)) {
      this.expiry = added;
    }
    this.touch();
  }

  /** The pantry-specific fields for `toJSON()`. */
  protected snapshot(): PantryItemSnapshot {
    return {
      ownerId: this.ownerId,
      name: this.itemName,
      quantity: this.itemQuantity,
      expiresOn: this.expiry,
    };
  }
}
