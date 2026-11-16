import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { NewPlannedMeal, PlannedMeal, PlannedMealChanges } from './planner.models';

/** All HTTP calls for the signed-in user's weekly planner. */
@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly baseUrl = `${API_PREFIX}/planner/meals`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /planner/meals`: the meals planned from `from` to `to` (both inclusive). */
  public getMeals(from: string, to: string): Observable<PlannedMeal[]> {
    return this.http.get<PlannedMeal[]>(this.baseUrl, { params: { from, to } });
  }

  /** `POST /planner/meals`: plans a recipe for a day and meal time. */
  public planMeal(meal: NewPlannedMeal): Observable<PlannedMeal> {
    return this.http.post<PlannedMeal>(this.baseUrl, meal);
  }

  /** `PATCH /planner/meals/:mealId`: moves a meal, changes its servings, or marks it eaten. */
  public updateMeal(mealId: string, changes: PlannedMealChanges): Observable<PlannedMeal> {
    return this.http.patch<PlannedMeal>(`${this.baseUrl}/${mealId}`, changes);
  }

  /** `DELETE /planner/meals/:mealId`: removes a meal from the planner. */
  public removeMeal(mealId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${mealId}`);
  }
}
