import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { recipe } from './recipe.fixtures';
import { RecipeFormPage } from './recipe-form-page';
import { RecipesService } from './recipes.service';

describe('RecipeFormPage', () => {
  const service = { getRecipe: vi.fn(), createRecipe: vi.fn(), updateRecipe: vi.fn() };

  async function render(
    recipeId: string | null = null,
  ): Promise<{ fixture: ComponentFixture<RecipeFormPage>; page: HTMLElement }> {
    await TestBed.configureTestingModule({
      imports: [RecipeFormPage],
      providers: [
        provideRouter([]),
        { provide: RecipesService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(recipeId ? { recipeId } : {}) } },
        },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RecipeFormPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  function type(page: HTMLElement, selector: string, value: string): void {
    const field = page.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function submit(page: HTMLElement): void {
    (page.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  }

  beforeEach(() => vi.resetAllMocks());

  it('uploads a recipe built from the form', async () => {
    service.createRecipe.mockReturnValue(of(recipe({ id: 'new-1' })));
    const { fixture, page } = await render();

    type(page, 'input[formControlName=title]', 'Scrambled Eggs');
    type(page, 'input[formControlName=tags]', 'Breakfast, , Quick ');
    type(page, '[aria-label="Ingredient 1"]', 'Eggs');
    type(page, '[aria-label="Amount of ingredient 1"]', '4');
    type(page, '[aria-label="Step 1"]', 'Whisk and cook.');
    submit(page);
    await fixture.whenStable();

    expect(service.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Scrambled Eggs',
        tags: ['Breakfast', 'Quick'],
        ingredients: [{ name: 'Eggs', quantity: { amount: 4, unit: 'piece' } }],
        steps: ['Whisk and cook.'],
        servings: 2,
        visibility: 'public',
        thumbnailUrl: null,
      }),
    );
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/recipes', 'new-1']);
  });

  it('explains what is missing instead of sending an incomplete recipe', async () => {
    const { fixture, page } = await render();

    type(page, 'input[formControlName=title]', 'Eggs');
    submit(page);
    fixture.detectChanges();

    expect(page.querySelector('.ui-error')?.textContent).toContain('Add at least one ingredient.');
    expect(service.createRecipe).not.toHaveBeenCalled();
  });

  it('adds and removes ingredient and step rows', async () => {
    const { fixture, page } = await render();
    const buttons = (): HTMLButtonElement[] => [...page.querySelectorAll('button')];

    buttons()
      .find((button) => button.textContent?.includes('+ Add ingredient'))
      ?.click();
    buttons()
      .find((button) => button.textContent?.includes('+ Add step'))
      ?.click();
    fixture.detectChanges();
    expect(page.querySelectorAll('.ingredient')).toHaveLength(2);
    expect(page.querySelectorAll('.step')).toHaveLength(2);

    (page.querySelector('[aria-label="Remove ingredient 2"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(page.querySelectorAll('.ingredient')).toHaveLength(1);
  });

  it('edits an existing recipe', async () => {
    service.getRecipe.mockReturnValue(of(recipe()));
    service.updateRecipe.mockReturnValue(of(recipe()));
    const { fixture, page } = await render('recipe-1');

    expect((page.querySelector('[aria-label="Ingredient 2"]') as HTMLInputElement).value).toBe(
      'Rice',
    );
    type(page, 'input[formControlName=title]', 'Better Chicken and Rice');
    submit(page);
    await fixture.whenStable();

    expect(service.updateRecipe).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({ title: 'Better Chicken and Rice', tags: ['High Protein'] }),
    );
  });
});
