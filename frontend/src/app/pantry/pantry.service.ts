import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { NewPantryItem, PantryItem, PantryItemChanges } from './pantry.models';

/** All HTTP calls for the signed-in user's pantry. */
@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly baseUrl = `${API_PREFIX}/pantry`;

  constructor(private readonly http: HttpClient) {}

  public getItems(): Observable<PantryItem[]> {
    return this.http.get<PantryItem[]>(this.baseUrl);
  }

  /** Returns the stored item, which may be an existing one the amount was added to. */
  public addItem(item: NewPantryItem): Observable<PantryItem> {
    return this.http.post<PantryItem>(this.baseUrl, item);
  }

  public updateItem(itemId: string, changes: PantryItemChanges): Observable<PantryItem> {
    return this.http.patch<PantryItem>(`${this.baseUrl}/${itemId}`, changes);
  }

  public removeItem(itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${itemId}`);
  }
}
