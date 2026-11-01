import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { NewRecipe, NewReview, Recipe } from './recipe.models';

/** All HTTP calls for recipes. */
@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly baseUrl = `${API_PREFIX}/recipes`;

  constructor(private readonly http: HttpClient) {}

  /** Public recipes plus the current user's private ones. */
  public getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.baseUrl);
  }

  public getRecipe(recipeId: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.baseUrl}/${recipeId}`);
  }

  public createRecipe(recipe: NewRecipe): Observable<Recipe> {
    return this.http.post<Recipe>(this.baseUrl, recipe);
  }

  /** Only the author may edit; the backend answers 403 otherwise. */
  public updateRecipe(recipeId: string, changes: Partial<NewRecipe>): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.baseUrl}/${recipeId}`, changes);
  }

  public deleteRecipe(recipeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${recipeId}`);
  }

  /** Adds or replaces the signed-in user's review; returns the updated recipe. */
  public reviewRecipe(recipeId: string, review: NewReview): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.baseUrl}/${recipeId}/reviews/me`, review);
  }
}
