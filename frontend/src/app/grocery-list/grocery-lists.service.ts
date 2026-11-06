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

  public getLists(): Observable<GroceryList[]> {
    return this.http.get<GroceryList[]>(this.baseUrl);
  }

  public createList(name: string): Observable<GroceryList> {
    return this.http.post<GroceryList>(this.baseUrl, { name });
  }

  public renameList(listId: string, name: string): Observable<GroceryList> {
    return this.http.patch<GroceryList>(`${this.baseUrl}/${listId}`, { name });
  }

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

  public addItem(listId: string, item: NewGroceryItem): Observable<GroceryList> {
    return this.http.post<GroceryList>(`${this.baseUrl}/${listId}/items`, item);
  }

  public updateItem(
    listId: string,
    itemId: string,
    changes: GroceryItemChanges,
  ): Observable<GroceryList> {
    return this.http.patch<GroceryList>(`${this.baseUrl}/${listId}/items/${itemId}`, changes);
  }

  public removeItem(listId: string, itemId: string): Observable<GroceryList> {
    return this.http.delete<GroceryList>(`${this.baseUrl}/${listId}/items/${itemId}`);
  }

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
