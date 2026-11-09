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
          macroSplit: { protein: 30, carbohydrates: 45, fat: 25 },
        }),
      ),
    );

    const page = await render();

    expect(input(page, 'default-servings').value).toBe('3');
    expect(checkbox(page, 'nut-free').checked).toBe(true);
    expect(checkbox(page, 'vegan').checked).toBe(false);
    expect(input(page, 'daily-calories').value).toBe('2200');
    expect(page.querySelector('.macro-total')?.textContent).toContain('100%');
  });

  it('saves servings, restrictions, and goals', async () => {
    service.load.mockReturnValue(of(preferences()));
    service.update.mockReturnValue(of(preferences({ defaultServings: 4 })));
    const page = await render();

    type(input(page, 'default-servings'), '4');
    checkbox(page, 'dairy-free').click();
    type(input(page, 'daily-calories'), '2000');
    type(input(page, 'macro-protein'), '30');
    type(input(page, 'macro-carbs'), '40');
    type(input(page, 'macro-fat'), '30');
    (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.update).toHaveBeenCalledWith({
      defaultServings: 4,
      dietaryRestrictions: ['dairy-free'],
      dailyCalories: 2000,
      macroSplit: { protein: 30, carbohydrates: 40, fat: 30 },
    });
  });

  it('flags a macro split that does not total 100% and shows the backend error', async () => {
    service.load.mockReturnValue(of(preferences()));
    service.update.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Protein, carbohydrates, and fat must add up to 100%.' },
          }),
      ),
    );
    const page = await render();

    type(input(page, 'macro-protein'), '50');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(page.querySelector('.macro-total')?.textContent).toContain('must be 100%');

    (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(page.querySelector('.ui-error')?.textContent).toContain('add up to 100%');
  });

  it('offers a retry when preferences cannot be loaded', async () => {
    service.load.mockReturnValue(of(null));

    const page = await render();

    expect(page.querySelector('.ui-status')?.textContent).toContain("couldn't load");
  });
});
