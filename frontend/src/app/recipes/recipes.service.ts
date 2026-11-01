import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/user-id.interceptor';
import { Recipe } from './recipe.models';

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
}
