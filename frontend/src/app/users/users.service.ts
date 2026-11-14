import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { Recipe } from '../recipes/recipe.models';
import { NewUser, ProfileChanges, User } from './user.models';

/** All HTTP calls for accounts, profiles, and saved recipes. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `${API_PREFIX}/users`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /users`: creates an account (409 if the username is taken). */
  public register(user: NewUser): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }

  /** TEMPORARY: username-only sign-in until Supabase authentication exists. */
  public logIn(username: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/login`, { username });
  }

  /** `GET /users/me`: the signed-in user's own profile. */
  public getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }

  /** `PATCH /users/me`: edits the signed-in user's profile. */
  public updateMe(changes: ProfileChanges): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/me`, changes);
  }

  /** `GET /users/:userId`: anyone's public profile. */
  public getUser(userId: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${userId}`);
  }

  /** `GET /users/me/saved-recipes`: the saved recipes the user can still see. */
  public getSavedRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.baseUrl}/me/saved-recipes`);
  }

  /** Returns the updated profile, whose `savedRecipeIds` now include the recipe. */
  public saveRecipe(recipeId: string): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/me/saved-recipes/${recipeId}`, {});
  }

  /** Removes a recipe from the saved list; returns the updated profile. */
  public unsaveRecipe(recipeId: string): Observable<User> {
    return this.http.delete<User>(`${this.baseUrl}/me/saved-recipes/${recipeId}`);
  }
}
