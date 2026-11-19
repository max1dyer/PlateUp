import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { Quantity } from '../grocery-list/grocery-list.models';
import { NewPantryItem, PantryItem, PantryItemChanges, StockLevel } from './pantry.models';

/** All HTTP calls for the signed-in user's pantry. */
@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly baseUrl = `${API_PREFIX}/pantry`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /pantry`: every item in the user's pantry. */
  public getItems(): Observable<PantryItem[]> {
    return this.http.get<PantryItem[]>(this.baseUrl);
  }

  /** How much of each ingredient the pantry holds, converted to the ingredient's unit. */
  public checkStock(
    ingredients: readonly { name: string; quantity: Quantity }[],
  ): Observable<StockLevel[]> {
    return this.http.post<StockLevel[]>(`${this.baseUrl}/stock-check`, { ingredients });
  }

  /** Returns the stored item, which may be an existing one the amount was added to. */
  public addItem(item: NewPantryItem): Observable<PantryItem> {
    return this.http.post<PantryItem>(this.baseUrl, item);
  }

  /** Renames an item or changes its amount. */
  public updateItem(itemId: string, changes: PantryItemChanges): Observable<PantryItem> {
    return this.http.patch<PantryItem>(`${this.baseUrl}/${itemId}`, changes);
  }

  /** Removes an item from the pantry. */
  public removeItem(itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${itemId}`);
  }
}
