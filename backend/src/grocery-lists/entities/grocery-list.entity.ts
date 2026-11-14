import { requireOneOf, requireText } from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { IngredientCategory } from '../../common/domain/ingredient-category';
import { isSameIngredient } from '../../common/domain/ingredient-name';
import { OwnedEntity } from '../../common/domain/owned.entity';
import { Quantity } from '../../common/domain/quantity';
import { GroceryListItem, GroceryListItemChanges } from './grocery-list-item.entity';

/** One ingredient to add with `GroceryList.addItems`. */
export interface NewGroceryEntry {
  name: string;
  quantity: Quantity | null;
  category?: IngredientCategory;
}

/** The fields a grocery list serializes to. */
export interface GroceryListSnapshot {
  ownerId: string;
  name: string;
  items: GroceryListItem[];
}

/** Aggregate root for a user's shopping list and its items. */
export class GroceryList extends OwnedEntity<GroceryListSnapshot> {
  private listName: string;
  /** The list's items keyed by id; a Map keeps them in the order they were added. */
  private readonly itemsById = new Map<string, GroceryListItem>();

  /** @throws DomainValidationError if the name is blank. */
  constructor(ownerId: string, name: string) {
    super(ownerId);
    this.listName = requireText(name, 'Grocery list name');
  }

  /** The list's display name, e.g. "Weekly shop". */
  public get name(): string {
    return this.listName;
  }

  /** A copy of the items, in the order they were added. */
  public get items(): GroceryListItem[] {
    return [...this.itemsById.values()];
  }

  /** The item with this id, or undefined if it is not on this list. */
  public findItem(itemId: string): GroceryListItem | undefined {
    return this.itemsById.get(itemId);
  }

  /** Renames the list; the name may not be blank. */
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
   * Adds several ingredients at once (e.g. a recipe's), combining each with a
   * matching line as `addItem` does. All of them are checked first, so if any
   * one is in a unit that can't be combined, nothing is added (UC6).
   */
  public addItems(entries: readonly NewGroceryEntry[]): GroceryListItem[] {
    // Validate every entry before changing anything, so a refused entry leaves the list untouched.
    entries.forEach((entry, index) => {
      const existing = this.findItemNamed(entry.name);
      // Two entries in the same batch can also clash with each other.
      const earlier = entries
        .slice(0, index)
        .find((other) => isSameIngredient(other.name, entry.name));
      const conflict =
        (existing && !existing.canAddQuantity(entry.quantity)) ||
        (earlier && !GroceryList.canCombine(earlier.quantity, entry.quantity));
      if (conflict) {
        throw new DomainValidationError(
          `${entry.name} is already on your list in a unit that can't be combined with ` +
            `${String(entry.quantity?.unit)}. Edit or remove that item first.`,
        );
      }
    });
    return entries.map((entry) => this.addItem(entry.name, entry.quantity, entry.category));
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

  /** The list-specific fields for `toJSON()`. */
  protected snapshot(): GroceryListSnapshot {
    return { ownerId: this.ownerId, name: this.listName, items: this.items };
  }

  /** True if two amounts can be summed: either is missing, or their units are compatible. */
  private static canCombine(a: Quantity | null, b: Quantity | null): boolean {
    return a === null || b === null || a.isCompatibleWith(b);
  }

  /** The item for the same ingredient as `name` (case and spacing ignored), if any. */
  private findItemNamed(name: string): GroceryListItem | undefined {
    return this.items.find((item) => item.isNamed(name));
  }
}
