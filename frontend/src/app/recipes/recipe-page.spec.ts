import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionService } from '../core/session.service';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { pantryItem } from '../pantry/pantry.fixtures';
import { PantryService } from '../pantry/pantry.service';
import { user } from '../users/user.fixtures';
import { UsersService } from '../users/users.service';
import { recipe, recipeReview } from './recipe.fixtures';
import { RecipePage, UNKNOWN_USER } from './recipe-page';
import { RecipesService } from './recipes.service';

describe('RecipePage', () => {
  const recipesService = { getRecipe: vi.fn(), deleteRecipe: vi.fn(), reviewRecipe: vi.fn() };
  const usersService = { getUser: vi.fn(), saveRecipe: vi.fn(), unsaveRecipe: vi.fn() };
  const groceryLists = { getLists: vi.fn(), createList: vi.fn(), addRecipe: vi.fn() };
  const pantry = { getItems: vi.fn() };
  const ME = 'me-1';

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
        { provide: GroceryListsService, useValue: groceryLists },
        { provide: PantryService, useValue: pantry },
      ],
    }).compileComponents();
    TestBed.inject(SessionService).setUser(user({ id: ME }));
    const fixture = TestBed.createComponent(RecipePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (page: HTMLElement, selector: string): string[] =>
    [...page.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    groceryLists.getLists.mockReturnValue(of([]));
    pantry.getItems.mockReturnValue(of([]));
  });

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

  it('shows reviews with reviewer names, calling the signed-in user "You"', async () => {
    recipesService.getRecipe.mockReturnValue(
      of(
        recipe({
          numRatings: 2,
          reviews: [
            recipeReview({ reviewerId: 'reviewer-1', comment: 'Great' }),
            recipeReview({ reviewerId: ME, rating: 3, comment: 'Okay' }),
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
    expect(usersService.getUser).not.toHaveBeenCalledWith(ME);
  });

  it('falls back to a placeholder when a user cannot be loaded', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe()));
    usersService.getUser.mockReturnValue(throwError(() => new Error('not found')));

    const page = await render();

    expect(text(page, '.recipe-author')[0]).toBe(`Uploaded by ${UNKNOWN_USER}`);
    expect(text(page, '.reviews-section > p')).toEqual(['No reviews yet']);
  });

  it('shows an error when the recipe cannot be loaded', async () => {
    recipesService.getRecipe.mockReturnValue(throwError(() => new Error('404')));

    const page = await render();

    expect(text(page, '.error-message')[0]).toContain("We couldn't load this recipe.");
    expect(page.querySelector('h1')).toBeNull();
  });

  it('scales ingredient amounts when the servings change', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe()));
    usersService.getUser.mockReturnValue(of({ displayName: 'Alice Cook' }));
    const page = await render();

    (page.querySelector('[aria-label="More servings"]') as HTMLButtonElement).click();
    (page.querySelector('[aria-label="More servings"]') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(text(page, '.stepper output')).toEqual(['4']);
    expect(text(page, '.ingredient-quantity')).toEqual(['3 lb', '2 cups']);
    expect(text(page, '.grocery-button')[0]).toContain('4 servings');
  });

  it('pre-marks ingredients already in the pantry and counts the rest as missing', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe()));
    usersService.getUser.mockReturnValue(of({ displayName: 'Alice Cook' }));
    pantry.getItems.mockReturnValue(of([pantryItem({ name: ' rice ' })]));

    const page = await render();

    expect(text(page, '.pantry-status')).toEqual(['X', '✓']);
    expect(text(page, '.section-heading span')[0]).toBe('1 of 2 in your pantry');
    expect(text(page, '.grocery-button')[0]).toContain('Add 1 to Grocery');

    (page.querySelector('[aria-label="Mark Rice as missing"]') as HTMLButtonElement).click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(text(page, '.grocery-button')[0]).toContain('Add 2 to Grocery');
  });

  it('still shows the recipe if the pantry cannot be loaded', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe()));
    usersService.getUser.mockReturnValue(of({ displayName: 'Alice Cook' }));
    pantry.getItems.mockReturnValue(throwError(() => new Error('offline')));

    const page = await render();

    expect(text(page, '.pantry-status')).toEqual(['X', 'X']);
    expect(text(page, '.grocery-button')[0]).toContain('Add 2 to Grocery');
  });

  it('shows Edit and Delete, and no review form, to the author', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe({ authorId: ME })));

    const page = await render();

    expect(text(page, '.author-actions a')).toEqual(['✏️ Edit']);
    expect(page.querySelector('app-review-form')).toBeNull();
    expect(text(page, '.recipe-author')[0]).toBe('Uploaded by You');
  });

  it('offers a review form to other users', async () => {
    recipesService.getRecipe.mockReturnValue(of(recipe()));
    usersService.getUser.mockReturnValue(of({ displayName: 'Alice Cook' }));

    const page = await render();

    expect(page.querySelector('.author-actions')).toBeNull();
    expect(page.querySelector('app-review-form')).not.toBeNull();
  });
});
