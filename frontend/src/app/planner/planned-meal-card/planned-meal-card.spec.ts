import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { plannedMeal } from '../planner.fixtures';
import { PlannedMeal } from '../planner.models';
import { PlannerService } from '../planner.service';
import { PlannedMealCard } from './planned-meal-card';

describe('PlannedMealCard', () => {
  const service = { updateMeal: vi.fn(), removeMeal: vi.fn() };
  const toasts = { success: vi.fn(), error: vi.fn() };

  async function render(meal: PlannedMeal): Promise<{
    fixture: ComponentFixture<PlannedMealCard>;
    page: HTMLElement;
    changed: PlannedMeal[];
    removed: string[];
  }> {
    await TestBed.configureTestingModule({
      imports: [PlannedMealCard],
      providers: [
        provideRouter([]),
        { provide: PlannerService, useValue: service },
        { provide: ToastService, useValue: toasts },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PlannedMealCard);
    fixture.componentRef.setInput('meal', meal);
    fixture.componentRef.setInput('range', { min: '2026-03-22', max: '2027-03-23' });
    fixture.componentRef.setInput('today', '2026-09-21');
    const changed: PlannedMeal[] = [];
    const removed: string[] = [];
    fixture.componentInstance.changed.subscribe((saved) => changed.push(saved));
    fixture.componentInstance.removed.subscribe((id) => removed.push(id));
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement, changed, removed };
  }

  const button = (page: HTMLElement, label: string): HTMLButtonElement =>
    [...page.querySelectorAll('button')].find((each) => each.textContent?.trim() === label)!;

  beforeEach(() => vi.resetAllMocks());

  it('shows the recipe with nutrition for the planned servings', async () => {
    const { page } = await render(plannedMeal({ servings: 2 }));

    expect(page.querySelector('.title')?.textContent).toBe('Chicken and Rice');
    expect(page.querySelector('.meta')?.textContent).toContain('2 servings');
    expect(page.querySelector('.macros')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1100 kcal · 90 g protein · 120 g carbs · 20 g fat',
    );
  });

  it('marks the meal eaten', async () => {
    const eaten = plannedMeal({ eaten: true });
    service.updateMeal.mockReturnValue(of(eaten));
    const { fixture, page, changed } = await render(plannedMeal());

    button(page, 'Mark as eaten').click();
    await fixture.whenStable();

    expect(service.updateMeal).toHaveBeenCalledWith('meal-1', { eaten: true });
    expect(changed).toEqual([eaten]);
  });

  it('moves the meal to another day and meal time', async () => {
    const moved = plannedMeal({ date: '2026-09-22', slot: 'dinner' });
    service.updateMeal.mockReturnValue(of(moved));
    const { fixture, page, changed } = await render(plannedMeal());

    (page.querySelector('.more') as HTMLButtonElement).click();
    fixture.detectChanges();
    const date = page.querySelector('.edit input[type=date]') as HTMLInputElement;
    date.value = '2026-09-22';
    date.dispatchEvent(new Event('input'));
    const slot = page.querySelector('.edit select') as HTMLSelectElement;
    slot.value = 'dinner';
    slot.dispatchEvent(new Event('change'));
    (page.querySelector('form.edit') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(service.updateMeal).toHaveBeenCalledWith('meal-1', {
      date: '2026-09-22',
      slot: 'dinner',
      servings: 2,
    });
    expect(toasts.success).toHaveBeenCalledWith(
      'Chicken and Rice moved to Tomorrow, September 22 (Dinner)',
    );
    expect(changed).toEqual([moved]);
  });

  it('removes the meal only after confirming', async () => {
    service.removeMeal.mockReturnValue(of(undefined));
    const { fixture, page, removed } = await render(plannedMeal());

    (page.querySelector('.more') as HTMLButtonElement).click();
    fixture.detectChanges();
    button(page, 'Remove').click();
    fixture.detectChanges();
    expect(service.removeMeal).not.toHaveBeenCalled();
    button(page, 'Yes, remove').click();
    await fixture.whenStable();

    expect(service.removeMeal).toHaveBeenCalledWith('meal-1');
    expect(removed).toEqual(['meal-1']);
  });
});
