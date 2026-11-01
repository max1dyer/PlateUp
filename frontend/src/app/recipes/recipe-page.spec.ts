import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DEMO_USER_ID } from '../core/user-id.interceptor';
import { UsersService } from '../users/users.service';
import { recipe, recipeReview } from './recipe.fixtures';
import { RecipePage, UNKNOWN_USER } from './recipe-page';
import { RecipesService } from './recipes.service';

describe('RecipePage', () => {
  const recipesService = { getRecipe: vi.fn() };
  const usersService = { getUser: vi.fn() };

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [RecipePage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ recipeId: 'recipe-1' })) },
        },
        { provide: RecipesService, useValue: recipesService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RecipePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (page: HTMLElement, selector: string): string[] =>
    [...page.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  beforeEach(() => vi.resetAllMocks());

  it('loads the recipe from the route id and shows its content', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe({ rating: 4.5, numRatings: 2 })));
    usersService.getUser.mockReturnValue(of({ displayName: 'Alice Cook' }));

    const page = await render();

    expect(recipesService.getRecipe).toHaveBeenCalledWith('recipe-1');
    expect(text(page, 'h1')).toEqual(['Chicken and Rice']);
    expect(text(page, '.recipe-author')[0]).toBe('Uploaded by Alice Cook');
    expect(text(page, '.recipe-tag')).toEqual(['High Protein']);
    expect(text(page, '.ingredient-name')).toEqual(['Chicken breast', 'Rice']);
    expect(text(page, '.recipe-steps li')).toEqual(['Cook the rice.', 'Grill the chicken.']);
    expect(text(page, '.recipe-stats')[0]).toContain('4.5');
  });

  it('shows reviews with reviewer names, calling the demo user "You"', async () => {
    recipesService.getRecipe.mockReturnValue(
      of(
        recipe({
          numRatings: 2,
          reviews: [
            recipeReview({ reviewerId: 'reviewer-1', comment: 'Great' }),
            recipeReview({ reviewerId: DEMO_USER_ID, rating: 3, comment: 'Okay' }),
          ],
        }),
      ),
    );
    usersService.getUser.mockImplementation((userId: string) =>
      of({ displayName: userId === 'reviewer-1' ? 'Bob Baker' : 'Alice Cook' }),
    );

    const page = await render();

    expect(text(page, '.review-user')).toEqual(['Bob Baker', 'You']);
    expect(text(page, '.review-comment')).toEqual(['Great', 'Okay']);
    expect(usersService.getUser).not.toHaveBeenCalledWith(DEMO_USER_ID);
  });

  it('falls back to a placeholder when a user cannot be loaded', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe()));
    usersService.getUser.mockReturnValue(throwError(() => new Error('not found')));

    const page = await render();

    expect(text(page, '.recipe-author')[0]).toBe(`Uploaded by ${UNKNOWN_USER}`);
    expect(text(page, '.reviews-section p')).toEqual(['No reviews yet']);
  });

  it('shows an error when the recipe cannot be loaded', async () => {
    recipesService.getRecipe.mockReturnValue(throwError(() => new Error('404')));

    const page = await render();

    expect(text(page, '.error-message')).toEqual(["We couldn't load this recipe."]);
    expect(page.querySelector('h1')).toBeNull();
  });
});
