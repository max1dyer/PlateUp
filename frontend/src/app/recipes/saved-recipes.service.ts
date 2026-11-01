import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SessionService } from '../core/session.service';
import { User } from '../users/user.models';
import { UsersService } from '../users/users.service';

/** Saving and unsaving recipes for the signed-in user, keeping the session's profile current. */
@Injectable({ providedIn: 'root' })
export class SavedRecipesService {
  constructor(
    private readonly users: UsersService,
    private readonly session: SessionService,
  ) {}

  public isSaved(recipeId: string): boolean {
    return this.session.currentUser()?.savedRecipeIds.includes(recipeId) ?? false;
  }

  /** Saves the recipe if it isn't saved yet, otherwise unsaves it. */
  public toggle(recipeId: string): Observable<User> {
    const request = this.isSaved(recipeId)
      ? this.users.unsaveRecipe(recipeId)
      : this.users.saveRecipe(recipeId);
    return request.pipe(tap((user) => this.session.setUser(user)));
  }
}
