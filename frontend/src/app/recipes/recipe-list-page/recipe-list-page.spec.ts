import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { preferences } from '../../preferences/preferences.fixtures';
import { UserPreferences } from '../../preferences/preferences.models';
import { PreferencesService } from '../../preferences/preferences.service';
import { recipe } from '../recipe.fixtures';
import { RecipeListPage } from './recipe-list-page';
import { RecipesService } from '../recipes.service';

describe('RecipeListPage', () => {
  const service = { getRecipes: vi.fn() };
  const preferencesService = {
    preferences: signal<UserPreferences | null>(null),
    load: vi.fn(),
  };

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [RecipeListPage],
      providers: [
        provideRouter([]),
        { provide: RecipesService, useValue: service },
        { provide: PreferencesService, useValue: preferencesService },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RecipeListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    preferencesService.preferences.set(null);
    preferencesService.load.mockReturnValue(of(null));
  });

  const titles = (page: HTMLElement): (string | null | undefined)[] =>
    [...page.querySelectorAll('.card .title')].map((title) => title.textContent);

  it("hides recipes that break the user's dietary restrictions, and can show them flagged", async () => {
    preferencesService.preferences.set(preferences({ dietaryRestrictions: ['dairy-free'] }));
    service.getRecipes.mockReturnValue(
      of([
        recipe({
          id: 'r1',
          title: 'Mac and Cheese',
          dietaryConflicts: { 'dairy-free': ['Cheese'] },
        }),
        recipe({ id: 'r2', title: 'Fruit Salad' }),
      ]),
    );
    const page = await render();

    expect(titles(page)).toEqual(['Fruit Salad']);
    expect(page.querySelector('.diet-note')?.textContent).toContain('1 recipe is hidden');

    (page.querySelector('.diet-note button') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(titles(page)).toEqual(['Mac and Cheese', 'Fruit Salad']);
    expect(page.querySelector('.diet-warning')?.textContent).toContain('Not dairy-free (Cheese)');
    expect((page.querySelector('#hide-unsuitable') as HTMLInputElement).checked).toBe(false);
  });

  it('shows every recipe and points to Preferences when no restriction is set', async () => {
    preferencesService.preferences.set(preferences());
    service.getRecipes.mockReturnValue(
      of([recipe({ id: 'r1', dietaryConflicts: { 'dairy-free': ['Cheese'] } })]),
    );
    const page = await render();

    expect(titles(page)).toHaveLength(1);
    expect(page.querySelector('.diet-warning')).toBeNull();
    expect(page.querySelector('.filter-panel a')?.getAttribute('href')).toBe('/preferences');
  });

  it('links each recipe to its page', async () => {
    const recipes = [recipe(), recipe({ id: 'recipe-2', title: 'Oatmeal' })];
    service.getRecipes.mockReturnValue(of(recipes));

    const page = await render();

    const cards = [...page.querySelectorAll<HTMLAnchorElement>('.card')];
    expect(cards.map((card) => card.querySelector('.title')?.textContent)).toEqual([
      'Chicken and Rice',
      'Oatmeal',
    ]);
    expect(cards[1].getAttribute('href')).toBe('/recipes/recipe-2');
  });

  it('shows an error when recipes cannot be loaded', async () => {
    service.getRecipes.mockReturnValue(throwError(() => new Error('offline')));

    const page = await render();

    expect(page.querySelector('.ui-status')?.textContent).toContain("We couldn't load recipes.");
  });

  it('starts newest first and re-sorts from the Sort by menu', async () => {
    service.getRecipes.mockReturnValue(
      of([
        recipe({ id: 'r1', title: 'Old and quick', createdAt: '2026-01-01', prepTimeMinutes: 5 }),
        recipe({ id: 'r2', title: 'New and slow', createdAt: '2026-02-01', prepTimeMinutes: 90 }),
      ]),
    );
    const page = await render();
    const titles = (): (string | null | undefined)[] =>
      [...page.querySelectorAll('.card .title')].map((title) => title.textContent);
    expect(titles()).toEqual(['New and slow', 'Old and quick']);

    const sort = page.querySelector('#recipe-sort') as HTMLSelectElement;
    sort.value = 'time';
    sort.dispatchEvent(new Event('change'));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(titles()).toEqual(['Old and quick', 'New and slow']);
  });

  it('keeps tag filters inside the Filters dropdown and counts the active one', async () => {
    service.getRecipes.mockReturnValue(of([recipe({ id: 'r1', tags: ['Breakfast'] })]));
    const page = await render();
    const menu = page.querySelector('details.filter-menu') as HTMLDetailsElement;

    expect(menu.querySelector('summary')?.textContent).toContain('Filters');
    expect(menu.querySelector('.badge')).toBeNull();

    (menu.querySelector('.tag') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(menu.querySelector('.badge')?.textContent).toBe('1');
  });

  it('filters by search text and by tag', async () => {
    service.getRecipes.mockReturnValue(
      of([
        recipe({ id: 'r1', title: 'Chicken and Rice', tags: ['High Protein'] }),
        recipe({ id: 'r2', title: 'Oatmeal', tags: ['Breakfast'], ingredients: [] }),
      ]),
    );
    const page = await render();
    const titles = (): (string | null | undefined)[] =>
      [...page.querySelectorAll('.card .title')].map((title) => title.textContent);

    const search = page.querySelector('#recipe-search') as HTMLInputElement;
    search.value = 'oat';
    search.dispatchEvent(new Event('input'));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(titles()).toEqual(['Oatmeal']);

    search.value = '';
    search.dispatchEvent(new Event('input'));
    [...page.querySelectorAll<HTMLButtonElement>('.tag')]
      .find((tag) => tag.textContent?.trim() === 'High Protein')
      ?.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(titles()).toEqual(['Chicken and Rice']);
  });

  it('hides recipes over the budget while it is on, and can show them flagged', async () => {
    preferencesService.preferences.set(preferences({ budgetEnabled: true, maxCostPerServing: 3 }));
    service.getRecipes.mockReturnValue(
      of([
        recipe({ id: 'r1', title: 'Steak Dinner', estimatedCostPerServing: 9.5 }),
        recipe({ id: 'r2', title: 'Rice Bowl', estimatedCostPerServing: 2.25 }),
      ]),
    );
    const page = await render();

    expect(titles(page)).toEqual(['Rice Bowl']);
    expect(page.querySelector('.budget-note')?.textContent).toContain('over your $3.00');

    (page.querySelector('.budget-note button') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(titles(page)).toEqual(['Steak Dinner', 'Rice Bowl']);
    expect(page.querySelector('.diet-warning')?.textContent).toContain(
      'Over your $3.00/serving budget',
    );
  });

  it('ignores the budget while it is turned off', async () => {
    preferencesService.preferences.set(preferences({ budgetEnabled: false, maxCostPerServing: 3 }));
    service.getRecipes.mockReturnValue(
      of([recipe({ id: 'r1', title: 'Steak Dinner', estimatedCostPerServing: 9.5 })]),
    );
    const page = await render();

    expect(titles(page)).toEqual(['Steak Dinner']);
    expect(page.querySelector('.budget-note')).toBeNull();
  });

  it('filters by a macro range and sorts by cost in either direction', async () => {
    service.getRecipes.mockReturnValue(
      of([
        recipe({
          id: 'r1',
          title: 'Salad',
          estimatedCostPerServing: 4,
          nutrition: { calories: 250, protein: 8, fat: 12, carbohydrates: 20 },
        }),
        recipe({
          id: 'r2',
          title: 'Pasta',
          estimatedCostPerServing: 2,
          nutrition: { calories: 700, protein: 20, fat: 15, carbohydrates: 95 },
        }),
        recipe({
          id: 'r3',
          title: 'Burrito',
          estimatedCostPerServing: 3,
          nutrition: { calories: 650, protein: 30, fat: 22, carbohydrates: 70 },
        }),
      ]),
    );
    const page = await render();
    const settle = () => TestBed.inject(ApplicationRef).whenStable();

    const sort = page.querySelector('#recipe-sort') as HTMLSelectElement;
    sort.value = 'cost';
    sort.dispatchEvent(new Event('change'));
    await settle();
    expect(titles(page)).toEqual(['Pasta', 'Burrito', 'Salad']);

    (page.querySelector('#reverse-sort') as HTMLButtonElement).click();
    await settle();
    expect(titles(page)).toEqual(['Salad', 'Burrito', 'Pasta']);

    const maxCarbs = page.querySelector('#range-carbohydrates-max') as HTMLInputElement;
    maxCarbs.value = '80';
    maxCarbs.dispatchEvent(new Event('input'));
    await settle();
    expect(titles(page)).toEqual(['Salad', 'Burrito']);
    expect(page.querySelector('.filter-menu .badge')?.textContent?.trim()).toBe('1');
  });
});
