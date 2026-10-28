import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecipeIngredient {
  name: string;
  quantity: {
    amount: number;
    unit: string;
  };
}

export interface Recipe {
  // Recipe meta data
  recipeId: string;
  authorId?: string; // TODO: implement in backend
  date?: string; // TODO: implement in backend
  title: string;
  description: string;
  thumbnailUrl: string | null;
  visibility: string; // implement in backend?

  servings: number;
  prepTimeMinutes: number;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  tags?: string[]; 

  ingredients: RecipeIngredient[];
  steps: string[];

  rating?: number; // TODO: implement all below in backend
  numRatings?: number;
  reviews?: {
    user: string;
    rating: number;
    comment: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiUrl = 'http://localhost:3000/recipes'; // replace with address of backend when its implemented
  private http = inject(HttpClient);

  getRecipe(recipeId: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${recipeId}`);
  }

  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.apiUrl);
  }
}