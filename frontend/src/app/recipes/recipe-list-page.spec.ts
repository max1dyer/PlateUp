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

    expect(page.querySelector('.status')?.textContent).toContain("We couldn't load recipes.");
  });
});
