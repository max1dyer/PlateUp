import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import {
  GroceryItemChanges,
  GroceryList,
  MoveToPantryResult,
  NewGroceryItem,
} from './grocery-list.models';

/** All HTTP calls for grocery lists. Item changes return the whole updated list. */
@Injectable({ providedIn: 'root' })
export class GroceryListsService {
  private readonly baseUrl = `${API_PREFIX}/grocery-lists`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /grocery-lists`: all of the signed-in user's lists. */
  public getLists(): Observable<GroceryList[]> {
    return this.http.get<GroceryList[]>(this.baseUrl);
  }

  /** `POST /grocery-lists`: creates an empty list. */
  public createList(name: string): Observable<GroceryList> {
    return this.http.post<GroceryList>(this.baseUrl, { name });
  }

  /** `PATCH /grocery-lists/:listId`: renames a list. */
  public renameList(listId: string, name: string): Observable<GroceryList> {
    return this.http.patch<GroceryList>(`${this.baseUrl}/${listId}`, { name });
  }

  /** `DELETE /grocery-lists/:listId`: deletes a list and its items. */
  public deleteList(listId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${listId}`);
  }

  /**
   * Adds a recipe's ingredients scaled to `servings`, merged into matching
   * lines (UC6). Ingredients named in `excludeIngredients` are left off.
   */
  public addRecipe(
    listId: string,
    recipeId: string,
    servings: number,
    excludeIngredients: readonly string[] = [],
  ): Observable<GroceryList> {
    return this.http.post<GroceryList>(`${this.baseUrl}/${listId}/recipes`, {
      recipeId,
      servings,
      excludeIngredients,
    });
  }

  /** Adds one item; an ingredient already on the list is combined with it. */
  public addItem(listId: string, item: NewGroceryItem): Observable<GroceryList> {
    return this.http.post<GroceryList>(`${this.baseUrl}/${listId}/items`, item);
  }

  /** Edits an item's name, amount, category, or checked state. */
  public updateItem(
    listId: string,
    itemId: string,
    changes: GroceryItemChanges,
  ): Observable<GroceryList> {
    return this.http.patch<GroceryList>(`${this.baseUrl}/${listId}/items/${itemId}`, changes);
  }

  /** Removes one item from the list. */
  public removeItem(listId: string, itemId: string): Observable<GroceryList> {
    return this.http.delete<GroceryList>(`${this.baseUrl}/${listId}/items/${itemId}`);
  }

  /** "Remove Checked Items": removes every purchased item from the list. */
  public removePurchasedItems(listId: string): Observable<GroceryList> {
    return this.http.delete<GroceryList>(`${this.baseUrl}/${listId}/purchased-items`);
  }

  /** Moves one item into the pantry and off the list. */
  public moveItemToPantry(listId: string, itemId: string): Observable<GroceryList> {
    return this.http.post<GroceryList>(`${this.baseUrl}/${listId}/items/${itemId}/pantry`, {});
  }

  /** Moves every checked item into the pantry; ones the pantry refuses stay on the list. */
  public movePurchasedToPantry(listId: string): Observable<MoveToPantryResult> {
    return this.http.post<MoveToPantryResult>(
      `${this.baseUrl}/${listId}/purchased-items/pantry`,
      {},
    );
  }
}
