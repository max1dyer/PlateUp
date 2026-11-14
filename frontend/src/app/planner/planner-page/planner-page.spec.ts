import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { addDays, startOfWeek, today } from '../../core/calendar-date';
import { preferences } from '../../preferences/preferences.fixtures';
import { UserPreferences } from '../../preferences/preferences.models';
import { PreferencesService } from '../../preferences/preferences.service';
import { plannedMeal } from '../planner.fixtures';
import { PlannerService } from '../planner.service';
import { PlannedMeal } from '../planner.models';
import { PlannerPage } from './planner-page';

describe('PlannerPage', () => {
  const service = {
    getMeals: vi.fn(),
    planMeal: vi.fn(),
    updateMeal: vi.fn(),
    removeMeal: vi.fn(),
  };
  const prefs = signal<UserPreferences | null>(null);
  const preferencesService = { preferences: prefs, load: () => of(prefs()) };
  const now = today();
  const monday = startOfWeek(now);
  /** Another day in this week, to check that only the selected day's meals are listed. */
  const otherDay = now === monday ? addDays(monday, 1) : monday;

  async function render(
    meals: PlannedMeal[],
    date: string | null = null,
  ): Promise<{ fixture: ComponentFixture<PlannerPage>; page: HTMLElement }> {
    service.getMeals.mockReturnValue(of(meals));
    await TestBed.configureTestingModule({
      imports: [PlannerPage],
      providers: [
        provideRouter([]),
        { provide: PlannerService, useValue: service },
        { provide: PreferencesService, useValue: preferencesService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(date ? { date } : {}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PlannerPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const text = (page: HTMLElement, selector: string): string[] =>
    [...page.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  beforeEach(() => {
    vi.resetAllMocks();
    prefs.set(null);
  });

  it('loads the current week and opens on today', async () => {
    const { page } = await render([]);

    expect(service.getMeals).toHaveBeenCalledWith(monday, addDays(monday, 6));
    expect(page.querySelectorAll('.day')).toHaveLength(7);
    expect(page.querySelector('.day.selected .date-number')?.textContent?.trim()).toBe(
      String(Number(now.slice(8))),
    );
    expect(text(page, '.day-plan > h2')[0]).toMatch(/^Today, /);
  });

  it('groups the selected day’s meals by meal time, with every slot shown', async () => {
    const { page } = await render([
      plannedMeal({ id: 'a', date: now, slot: 'dinner' }),
      plannedMeal({ id: 'b', date: now, slot: 'breakfast' }),
      plannedMeal({ id: 'c', date: otherDay }),
    ]);

    expect(text(page, '.slot-heading h3')).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
    expect(
      page.querySelectorAll('.slot')[0].querySelectorAll('app-planned-meal-card'),
    ).toHaveLength(1);
    expect(
      page.querySelectorAll('.slot')[3].querySelectorAll('app-planned-meal-card'),
    ).toHaveLength(1);
    expect(text(page, '.slot')[1]).toContain('Nothing planned');
  });

  it('totals the day’s nutrition against the calorie goal', async () => {
    prefs.set(
      preferences({
        dailyTargets: { calories: 2000, protein: null, carbohydrates: null, fat: null },
      }),
    );
    const { page } = await render([
      plannedMeal({ id: 'a', date: now, servings: 1, eaten: true }),
      plannedMeal({ id: 'b', date: now, servings: 2 }),
    ]);

    expect(text(page, '.kcal')[0]).toBe('1,650 kcal');
    expect(text(page, '.kcal-row .ui-hint')[0]).toBe('of 2,000 kcal goal');
    expect(text(page, '.kcal-detail')[0]).toBe('550 kcal eaten · 1,100 kcal still planned');
    expect(text(page, '.nutrition')[0]).toContain('350 kcal left to plan');
    expect(text(page, '.macro-value')).toEqual(['135 g', '180 g', '30 g']);
  });

  it('moves to the next week and loads its meals', async () => {
    const { fixture, page } = await render([]);

    (page.querySelector('[aria-label="Next week"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const nextMonday = addDays(monday, 7);
    expect(service.getMeals).toHaveBeenLastCalledWith(nextMonday, addDays(nextMonday, 6));
  });

  it('opens the day in the address when it is within half a year', async () => {
    const date = addDays(now, 100);

    await render([], date);

    const week = startOfWeek(date);
    expect(service.getMeals).toHaveBeenCalledWith(week, addDays(week, 6));
  });

  it('ignores a day in the address beyond half a year', async () => {
    await render([], addDays(now, 400));

    expect(service.getMeals).toHaveBeenCalledWith(monday, addDays(monday, 6));
  });

  it('stops at the last week of the planning range', async () => {
    const { page } = await render([], addDays(now, 183));

    expect((page.querySelector('[aria-label="Next week"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((page.querySelector('[aria-label="Previous week"]') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('shows a retry when the week cannot be loaded', async () => {
    service.getMeals.mockReturnValue(throwError(() => new Error('down')));
    await TestBed.configureTestingModule({
      imports: [PlannerPage],
      providers: [
        provideRouter([]),
        { provide: PlannerService, useValue: service },
        { provide: PreferencesService, useValue: preferencesService },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PlannerPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;

    expect(text(page, '.ui-status')[0]).toContain("We couldn't load your planner.");
  });
});
