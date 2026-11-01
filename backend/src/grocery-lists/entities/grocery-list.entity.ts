import { requireOneOf, requireText } from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { IngredientCategory } from '../../common/domain/ingredient-category';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Quantity } from '../../common/domain/quantity';
import { GroceryListItem, GroceryListItemChanges } from './grocery-list-item.entity';

export interface GroceryListSnapshot {
  ownerId: string;
  name: string;
  items: GroceryListItem[];
}

/** Aggregate root for a user's shopping list and its items. */
export class GroceryList extends OwnedEntity<GroceryListSnapshot> {
  private listName: string;
  private readonly itemsById = new Map<string, GroceryListItem>();

  constructor(ownerId: string, name: string) {
    super(ownerId);
    this.listName = requireText(name, 'Grocery list name');
  }

  public get name(): string {
    return this.listName;
  }

  public get items(): GroceryListItem[] {
    return [...this.itemsById.values()];
  }

  public rename(name: string): void {
    this.listName = requireText(name, 'Grocery list name');
    this.touch();
  }

  /**
   * Adds an item. A list holds one line per ingredient, so if the ingredient
   * is already listed the amount is combined into that line (which is
   * returned instead); an amount in a unit that can't be combined is refused.
   */
  public addItem(
    name: string,
    quantity: Quantity | null = null,
    category: IngredientCategory = IngredientCategory.Other,
  ): GroceryListItem {
    requireOneOf(category, IngredientCategory, 'category');
    const existing = this.findItemNamed(name);
    if (existing) {
      if (!existing.canAddQuantity(quantity)) {
        throw new DomainValidationError(
          `${existing.name} is already on your list in ${String(existing.quantity?.unit)}. ` +
            'Add it in a compatible unit, or edit the existing item.',
        );
      }
      existing.addQuantity(quantity);
      this.touch();
      return existing;
    }
    const item = new GroceryListItem(name, quantity, category);
    this.itemsById.set(item.id, item);
    this.touch();
    return item;
  }

  /**
   * Edits an item's name, quantity, category, or purchased flag. Returns false
   * if the item is not on this list. Renaming to another line's ingredient is
   * refused, to keep one line per ingredient.
   */
  public updateItem(itemId: string, changes: GroceryListItemChanges): boolean {
    const item = this.itemsById.get(itemId);
    if (!item) {
      return false;
    }
    if (changes.name !== undefined) {
      const other = this.findItemNamed(changes.name);
      if (other && other !== item) {
        throw new DomainValidationError(
          `${other.name} is already on your list. Edit that item instead.`,
        );
      }
    }
    item.update(changes);
    this.touch();
    return true;
  }

  /** Returns false if the item is not on this list. */
  public removeItem(itemId: string): boolean {
    const removed = this.itemsById.delete(itemId);
    if (removed) {
      this.touch();
    }
    return removed;
  }

  /** "Remove Checked Items": drops every purchased item and returns how many were removed. */
  public removePurchasedItems(): number {
    const purchased = this.items.filter((item) => item.purchased);
    purchased.forEach((item) => this.itemsById.delete(item.id));
    if (purchased.length > 0) {
      this.touch();
    }
    return purchased.length;
  }

  protected snapshot(): GroceryListSnapshot {
    return { ownerId: this.ownerId, name: this.listName, items: this.items };
  }

  private findItemNamed(name: string): GroceryListItem | undefined {
    return this.items.find((item) => item.isNamed(name));
  }
}
