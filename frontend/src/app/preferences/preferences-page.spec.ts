import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { preferences } from './preferences.fixtures';
import { PreferencesPage } from './preferences-page';
import { PreferencesService } from './preferences.service';

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
  const checkbox = (page: HTMLElement, value: string): HTMLInputElement =>
    page.querySelector(`input[type="checkbox"][value="${value}"]`) as HTMLInputElement;

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

  it('saves servings, restrictions, and goals', async () => {
    service.load.mockReturnValue(of(preferences()));
    service.update.mockReturnValue(of(preferences({ defaultServings: 4 })));
    const page = await render();

    type(input(page, 'default-servings'), '4');
    checkbox(page, 'dairy-free').click();
    type(input(page, 'daily-calories'), '2000');
    type(input(page, 'macro-protein'), '150');
    type(input(page, 'macro-carbohydrates'), '200');
    (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.update).toHaveBeenCalledWith({
      defaultServings: 4,
      dietaryRestrictions: ['dairy-free'],
      dailyCalories: 2000,
      macroGoals: { protein: 150, carbohydrates: 200, fat: null },
    });
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

    (page.querySelector('.plan-status .link-button') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(input(page, 'macro-fat').value).toBe('66');
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

  it('shows the backend error when saving fails', async () => {
    service.load.mockReturnValue(of(preferences()));
    service.update.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'Protein (g) is invalid.' } }),
      ),
    );
    const page = await render();

    (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.querySelector('.ui-error')?.textContent).toContain('Protein (g)');
  });

  it('offers a retry when preferences cannot be loaded', async () => {
    service.load.mockReturnValue(of(null));

    const page = await render();

    expect(page.querySelector('.ui-status')?.textContent).toContain("couldn't load");
  });
});
