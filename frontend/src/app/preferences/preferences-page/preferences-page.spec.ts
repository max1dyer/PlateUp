import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { preferences } from '../preferences.fixtures';
import { PreferencesPage } from './preferences-page';
import { PreferenceChanges, UserPreferences } from '../preferences.models';
import { PreferencesService } from '../preferences.service';

describe('PreferencesPage', () => {
  const service = { load: vi.fn(), update: vi.fn() };

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [PreferencesPage],
      providers: [provideRouter([]), { provide: PreferencesService, useValue: service }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PreferencesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const input = (page: HTMLElement, id: string): HTMLInputElement =>
    page.querySelector(`#${id}`) as HTMLInputElement;
  const type = (field: HTMLInputElement, value: string): void => {
    field.value = value;
    field.dispatchEvent(new Event('input'));
  };
  /** Types a value and leaves the field, which is when number fields save. */
  const enter = (field: HTMLInputElement, value: string): void => {
    type(field, value);
    field.dispatchEvent(new Event('change'));
  };
  const checkbox = (page: HTMLElement, value: string): HTMLInputElement =>
    page.querySelector(`input[type="checkbox"][value="${value}"]`) as HTMLInputElement;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const status = (page: HTMLElement) => page.querySelector('.save-state')?.textContent ?? '';

  /** Makes `update` behave like the backend: merge the changes and reply with the result. */
  function saveLikeBackend(start: UserPreferences = preferences()): void {
    let saved = start;
    service.update.mockImplementation((changes: PreferenceChanges) => {
      saved = { ...saved, ...changes, macroGoals: { ...saved.macroGoals, ...changes.macroGoals } };
      return of(saved);
    });
  }

  /** Makes `update` refuse with this message. */
  function refuse(message: string): void {
    service.update.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message } })),
    );
  }

  beforeEach(() => vi.resetAllMocks());

  it('shows the saved preferences', async () => {
    service.load.mockReturnValue(
      of(
        preferences({
          defaultServings: 3,
          dietaryRestrictions: ['nut-free'],
          dailyCalories: 2200,
          macroGoals: { protein: 165, carbohydrates: 250, fat: null },
        }),
      ),
    );

    const page = await render();

    expect(input(page, 'default-servings').value).toBe('3');
    expect(checkbox(page, 'nut-free').checked).toBe(true);
    expect(checkbox(page, 'vegan').checked).toBe(false);
    expect(input(page, 'daily-calories').value).toBe('2200');
    expect(input(page, 'macro-protein').value).toBe('165');
    // 2200 - 165*4 - 250*4 = 540 kcal of fat = 60 g, shown as a preview only.
    expect(input(page, 'macro-fat').value).toBe('');
    expect(input(page, 'macro-fat').placeholder).toBe('60');
  });

  it('saves each section on its own as soon as it changes, with no Save button', async () => {
    service.load.mockReturnValue(of(preferences()));
    saveLikeBackend();
    const page = await render();

    expect(page.querySelector('button[type="submit"]')).toBeNull();
    expect(status(page)).toContain('Changes save automatically');

    enter(input(page, 'default-servings'), '4');
    checkbox(page, 'dairy-free').click();
    enter(input(page, 'daily-calories'), '2000');
    enter(input(page, 'macro-protein'), '150');
    await settle();

    expect(service.update.mock.calls.map(([changes]) => changes)).toEqual([
      { defaultServings: 4 },
      { dietaryRestrictions: ['dairy-free'] },
      { dailyCalories: 2000, macroGoals: { protein: null, carbohydrates: null, fat: null } },
      { dailyCalories: 2000, macroGoals: { protein: 150, carbohydrates: null, fat: null } },
    ]);
    expect(checkbox(page, 'dairy-free').checked).toBe(true);
    expect(status(page)).toContain('All changes saved');
  });

  it('does not save a number field while it is being typed in', async () => {
    service.load.mockReturnValue(of(preferences()));
    saveLikeBackend();
    const page = await render();

    type(input(page, 'daily-calories'), '20');
    await settle();

    expect(service.update).not.toHaveBeenCalled();
  });

  it('puts the saved servings back when the field is left blank, without saving', async () => {
    service.load.mockReturnValue(of(preferences({ defaultServings: 3 })));
    const page = await render();

    enter(input(page, 'default-servings'), '');
    await settle();

    expect(input(page, 'default-servings').value).toBe('3');
    expect(service.update).not.toHaveBeenCalled();
  });

  it('previews the missing macro and can copy the preview into the field', async () => {
    service.load.mockReturnValue(of(preferences()));
    const page = await render();

    type(input(page, 'daily-calories'), '2000');
    type(input(page, 'macro-protein'), '150');
    type(input(page, 'macro-carbohydrates'), '200');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(input(page, 'macro-fat').placeholder).toBe('66');
    expect(page.querySelector('.plan-status')?.textContent).toContain('66 g of fat');

    saveLikeBackend();
    (page.querySelector('.plan-status .link-button') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(input(page, 'macro-fat').value).toBe('66');
    expect(service.update).toHaveBeenCalledWith({
      dailyCalories: 2000,
      macroGoals: { protein: 150, carbohydrates: 200, fat: 66 },
    });
  });

  it('previews total calories when only macros are entered', async () => {
    service.load.mockReturnValue(of(preferences()));
    const page = await render();

    type(input(page, 'macro-protein'), '150');
    type(input(page, 'macro-carbohydrates'), '200');
    type(input(page, 'macro-fat'), '60');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(input(page, 'daily-calories').placeholder).toBe('1940');
  });

  it('flags macros that overshoot the calorie goal, with the amount', async () => {
    service.load.mockReturnValue(of(preferences()));
    const page = await render();

    type(input(page, 'daily-calories'), '1500');
    type(input(page, 'macro-protein'), '200');
    type(input(page, 'macro-carbohydrates'), '250');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.querySelector('.plan-status.over')?.textContent).toContain('300 kcal over');
    expect(input(page, 'daily-calories').classList).toContain('over');
    expect(page.querySelector('.calorie-bar .overflow')).not.toBeNull();
  });

  it('shows a refused goal in its section and keeps what the user typed', async () => {
    service.load.mockReturnValue(of(preferences()));
    refuse('Daily calories must be between 500 and 10000.');
    const page = await render();

    enter(input(page, 'daily-calories'), '50');
    await settle();

    const goals = page.querySelector('fieldset.goals') as HTMLElement;
    expect(goals.querySelector('.ui-error')?.textContent).toContain('Daily calories');
    expect(input(page, 'daily-calories').value).toBe('50');
    expect(status(page)).toContain("couldn't be saved");

    saveLikeBackend();
    enter(input(page, 'daily-calories'), '1800');
    await settle();

    expect(goals.querySelector('.ui-error')).toBeNull();
    expect(status(page)).toContain('All changes saved');
  });

  it('offers a retry when preferences cannot be loaded', async () => {
    service.load.mockReturnValue(of(null));

    const page = await render();

    expect(page.querySelector('.ui-status')?.textContent).toContain("couldn't load");
  });

  it('shows and saves the budget switch and the limit per serving', async () => {
    const start = preferences({ maxCostPerServing: 4 });
    service.load.mockReturnValue(of(start));
    saveLikeBackend(start);
    const page = await render();

    expect(input(page, 'budget-enabled').checked).toBe(false);
    expect(input(page, 'max-cost-per-serving').value).toBe('4');

    input(page, 'budget-enabled').click();
    enter(input(page, 'max-cost-per-serving'), '3.5');
    enter(input(page, 'max-cost-per-serving'), '');
    await settle();

    expect(service.update.mock.calls.map(([changes]) => changes)).toEqual([
      { budgetEnabled: true },
      { maxCostPerServing: 3.5 },
      { maxCostPerServing: null },
    ]);
    expect(input(page, 'budget-enabled').checked).toBe(true);
  });

  it('shows and saves each sharing setting when clicked', async () => {
    const start = preferences({
      blockRecipeShares: true,
      blockListInvites: false,
      blockListCopies: true,
    });
    service.load.mockReturnValue(of(start));
    saveLikeBackend(start);
    const page = await render();

    expect(input(page, 'block-recipe-shares').checked).toBe(true);
    expect(input(page, 'block-list-invites').checked).toBe(false);
    expect(input(page, 'block-list-copies').checked).toBe(true);

    input(page, 'block-list-invites').click();
    await settle();

    expect(service.update).toHaveBeenCalledWith({ blockListInvites: true });
    expect(input(page, 'block-list-invites').checked).toBe(true);
  });

  it('unticks a sharing setting the backend refused, and says why', async () => {
    service.load.mockReturnValue(of(preferences()));
    refuse('Block live list invites must be true or false.');
    const page = await render();

    input(page, 'block-list-invites').click();
    await settle();

    expect(input(page, 'block-list-invites').checked).toBe(false);
    expect(page.querySelector('fieldset .ui-error')?.textContent).toContain('Block live list');
    expect(status(page)).toContain("couldn't be saved");
  });

  it('unticks a sharing setting the reply does not confirm', async () => {
    service.load.mockReturnValue(of(preferences()));
    // An older backend that doesn't know the setting leaves it out of its reply.
    const withoutIt: Partial<UserPreferences> = preferences();
    delete withoutIt.blockListInvites;
    service.update.mockReturnValue(of(withoutIt));
    const page = await render();

    input(page, 'block-list-invites').click();
    await settle();

    expect(input(page, 'block-list-invites').checked).toBe(false);
  });
});
