import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { recipe } from '../../recipes/recipe.fixtures';
import { RecipesService } from '../../recipes/recipes.service';
import { plannedMeal } from '../planner.fixtures';
import { PlannedMeal } from '../planner.models';
import { PlannerService } from '../planner.service';
import { AddMealForm } from './add-meal-form';

describe('AddMealForm', () => {
  const planner = { planMeal: vi.fn() };
  const toasts = { success: vi.fn(), error: vi.fn() };
  const recipes = [
    recipe({ id: 'r1', title: 'Chicken and Rice', servings: 2 }),
    recipe({
      id: 'r2',
      title: 'Overnight Oats',
      servings: 1,
      ingredients: [{ name: 'Rolled oats', quantity: { amount: 1, unit: 'cup' } }],
    }),
  ];

  async function render(defaultServings: number | null): Promise<{
    fixture: ComponentFixture<AddMealForm>;
    page: HTMLElement;
    planned: PlannedMeal[];
  }> {
    await TestBed.configureTestingModule({
      imports: [AddMealForm],
      providers: [
        { provide: RecipesService, useValue: { getRecipes: () => of(recipes) } },
        { provide: PlannerService, useValue: planner },
        { provide: ToastService, useValue: toasts },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AddMealForm);
    fixture.componentRef.setInput('date', '2026-09-21');
    fixture.componentRef.setInput('today', '2026-09-21');
    fixture.componentRef.setInput('slot', 'breakfast');
    fixture.componentRef.setInput('defaultServings', defaultServings);
    const planned: PlannedMeal[] = [];
    fixture.componentInstance.planned.subscribe((meal) => planned.push(meal));
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement, planned };
  }

  function search(fixture: ComponentFixture<AddMealForm>, text: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type=search]',
    ) as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  const titles = (page: HTMLElement): string[] =>
    [...page.querySelectorAll('.result-title')].map((each) => each.textContent?.trim() ?? '');

  beforeEach(() => vi.resetAllMocks());

  it('searches recipes by name or ingredient', async () => {
    const { fixture, page } = await render(null);

    expect(titles(page)).toEqual(['Chicken and Rice', 'Overnight Oats']);
    search(fixture, 'oats');
    expect(titles(page)).toEqual(['Overnight Oats']);
    search(fixture, 'tofu');
    expect(page.querySelector('.results')?.textContent).toContain('No recipes match “tofu”.');
  });

  it('plans the chosen recipe at the preferred servings and meal time', async () => {
    const meal = plannedMeal({ slot: 'breakfast', servings: 3 });
    planner.planMeal.mockReturnValue(of(meal));
    const { fixture, page, planned } = await render(3);

    (page.querySelector('.result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((page.querySelector('input[type=number]') as HTMLInputElement).value).toBe('3');
    (page.querySelector('form.details') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(planner.planMeal).toHaveBeenCalledWith({
      recipeId: 'r1',
      date: '2026-09-21',
      slot: 'breakfast',
      servings: 3,
    });
    expect(toasts.success).toHaveBeenCalledWith(
      'Chicken and Rice is planned for Today, September 21 (Breakfast, 3 servings).',
    );
    expect(planned).toEqual([meal]);
  });

  it('suggests the recipe’s own servings when there is no preference', async () => {
    const { fixture, page } = await render(null);

    (page.querySelectorAll('.result')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect((page.querySelector('input[type=number]') as HTMLInputElement).value).toBe('1');
  });
});
