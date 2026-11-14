import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { plannedMeal } from './planner.fixtures';
import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  let service: PlannerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlannerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMeals asks for a date range', () => {
    service.getMeals('2026-09-21', '2026-09-27').subscribe();

    const request = http.expectOne('/api/planner/meals?from=2026-09-21&to=2026-09-27');
    expect(request.request.method).toBe('GET');
    request.flush([plannedMeal()]);
  });

  it('planMeal, updateMeal, and removeMeal use the meal routes', () => {
    service.planMeal({ recipeId: 'recipe-1', date: '2026-09-21', slot: 'lunch' }).subscribe();
    service.updateMeal('meal-1', { eaten: true }).subscribe();
    service.removeMeal('meal-1').subscribe();

    const plan = http.expectOne({ method: 'POST', url: '/api/planner/meals' });
    expect(plan.request.body).toEqual({ recipeId: 'recipe-1', date: '2026-09-21', slot: 'lunch' });
    plan.flush(plannedMeal());
    const update = http.expectOne({ method: 'PATCH', url: '/api/planner/meals/meal-1' });
    expect(update.request.body).toEqual({ eaten: true });
    update.flush(plannedMeal({ eaten: true }));
    http.expectOne({ method: 'DELETE', url: '/api/planner/meals/meal-1' }).flush(null);
  });
});
