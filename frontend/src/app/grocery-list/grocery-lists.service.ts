import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/user-id.interceptor';
import { GroceryItemChanges, GroceryList, NewGroceryItem } from './grocery-list.models';

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
}
