import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { Recipe, SharedWithUser } from './recipe.models';

/** HTTP calls for sharing recipes with specific users. */
@Injectable({ providedIn: 'root' })
export class RecipeSharesService {
  private readonly baseUrl = `${API_PREFIX}/recipe-shares`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /recipe-shares/received`: recipes other users shared with the signed-in user. */
  public getReceived(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.baseUrl}/received`);
  }

  /** `GET /recipe-shares/recipes/:recipeId`: who the author shared the recipe with. */
  public getShares(recipeId: string): Observable<SharedWithUser[]> {
    return this.http.get<SharedWithUser[]>(`${this.baseUrl}/recipes/${recipeId}`);
  }

  /** Shares the recipe by username; returns the updated list of recipients. */
  public share(recipeId: string, recipientUsername: string): Observable<SharedWithUser[]> {
    return this.http.post<SharedWithUser[]>(`${this.baseUrl}/recipes/${recipeId}`, {
      recipientUsername,
    });
  }

  /** Revokes one recipient's access; returns the updated list of recipients. */
  public revoke(recipeId: string, recipientId: string): Observable<SharedWithUser[]> {
    return this.http.delete<SharedWithUser[]>(`${this.baseUrl}/recipes/${recipeId}/${recipientId}`);
  }
}
