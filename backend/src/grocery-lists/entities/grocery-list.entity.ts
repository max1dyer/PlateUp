import { requireText } from '../../common/domain/guards';
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

  public addItem(name: string, quantity: Quantity | null = null): GroceryListItem {
    const item = new GroceryListItem(name, quantity);
    this.itemsById.set(item.id, item);
    this.touch();
    return item;
  }

  /** Edits an item's name, quantity, or purchased flag. Returns false if the item is not on this list. */
  public updateItem(itemId: string, changes: GroceryListItemChanges): boolean {
    const item = this.itemsById.get(itemId);
    if (!item) {
      return false;
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
}
