import { requireCalendarDateOrNull } from '../../common/domain/calendar-date';
import { requireOneOf, requireText } from '../../common/domain/guards';
import { IngredientCategory, guessCategory } from '../../common/domain/ingredient-category';
import { isSameIngredient } from '../../common/domain/ingredient-name';
import { EntityRecord } from '../../common/domain/base.entity';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Quantity, QuantityRecord } from '../../common/domain/quantity';

/** The fields a pantry item serializes to. */
export interface PantryItemSnapshot {
  ownerId: string;
  name: string;
  quantity: Quantity;
  /** Day the item expires (`YYYY-MM-DD`), or null if the user gave none. */
  expiresOn: string | null;
  /** Pantry section the item is listed under, e.g. "produce". */
  category: IngredientCategory;
}

/** A pantry item's stored state. */
export interface PantryItemRecord extends EntityRecord {
  ownerId: string;
  name: string;
  quantity: QuantityRecord;
  expiresOn: string | null;
  category: IngredientCategory;
}

/** An ingredient the user has on hand. */
export class PantryItem extends OwnedEntity<PantryItemSnapshot> {
  private itemName: string;
  private itemQuantity: Quantity;
  private expiry: string | null;
  private itemCategory: IngredientCategory;

  /**
   * With no category, the section is guessed from the name (e.g. "Chicken" is Protein).
   *
   * @throws DomainValidationError if the name is blank, the expiration date is invalid, or the
   * category is unknown.
   */
  constructor(
    ownerId: string,
    name: string,
    quantity: Quantity,
    expiresOn: string | null = null,
    category?: IngredientCategory,
  ) {
    super(ownerId);
    this.itemName = requireText(name, 'Pantry item name');
    this.itemQuantity = quantity;
    this.expiry = requireCalendarDateOrNull(expiresOn, 'Expiration date');
    this.itemCategory =
      category === undefined
        ? guessCategory(this.itemName)
        : requireOneOf(category, IngredientCategory, 'category');
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

  /** Pantry section the item is listed under. */
  public get category(): IngredientCategory {
    return this.itemCategory;
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

  /** Moves the item to another pantry section. */
  public setCategory(category: IngredientCategory): void {
    this.itemCategory = requireOneOf(category, IngredientCategory, 'category');
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

  /** Rebuilds a stored pantry item with its id and timestamps. */
  public static fromRecord(record: PantryItemRecord): PantryItem {
    return new PantryItem(
      record.ownerId,
      record.name,
      Quantity.fromRecord(record.quantity),
      record.expiresOn,
      record.category,
    ).restoreIdentity(record);
  }

  /** The item's complete state as plain data (see `BaseEntity.toRecord`). */
  public toRecord(): PantryItemRecord {
    return {
      ...this.identityRecord(),
      ownerId: this.ownerId,
      name: this.itemName,
      quantity: this.itemQuantity.toRecord(),
      expiresOn: this.expiry,
      category: this.itemCategory,
    };
  }

  /** The pantry-specific fields for `toJSON()`. */
  protected snapshot(): PantryItemSnapshot {
    return {
      ownerId: this.ownerId,
      name: this.itemName,
      quantity: this.itemQuantity,
      expiresOn: this.expiry,
      category: this.itemCategory,
    };
  }
}
