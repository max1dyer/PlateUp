import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { recipe } from './recipe.fixtures';
import { RecipeListPage } from './recipe-list-page';
import { RecipesService } from './recipes.service';

describe('RecipeListPage', () => {
  const service = { getRecipes: vi.fn() };

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [RecipeListPage],
      providers: [provideRouter([]), { provide: RecipesService, useValue: service }],
    }).compileComponents();
    const fixture = TestBed.createComponent(RecipeListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => vi.resetAllMocks());

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
});
