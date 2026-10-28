import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Unit } from '../common/domain/quantity';
import { RecipeVisibility } from './entities/recipe.entity';
import { RecipesService } from './recipes.service';
import { InMemoryRecipeRepository } from './repositories/in-memory-recipe.repository';
import { RecipeRepository } from './repositories/recipe.repository';
import { buildCreateRecipeDto } from './testing/recipe.fixtures';

describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: RecipeRepository, useClass: InMemoryRecipeRepository },
      ],
    }).compile();
    service = moduleRef.get(RecipesService);
  });

  it('create stores a recipe owned by the author', async () => {
    const recipe = await service.create('alice', buildCreateRecipeDto());

    expect(recipe.authorId).toBe('alice');
    await expect(service.findOne(recipe.id, 'alice')).resolves.toBe(recipe);
  });

  it('create defaults to public visibility', async () => {
    const recipe = await service.create('alice', buildCreateRecipeDto({ visibility: undefined }));
    expect(recipe.visibility).toBe(RecipeVisibility.Public);
  });

  it('findAllVisibleTo hides other users’ private recipes', async () => {
    await service.create('alice', buildCreateRecipeDto({ title: 'Public' }));
    await service.create(
      'alice',
      buildCreateRecipeDto({ title: 'Secret', visibility: RecipeVisibility.Private }),
    );

    const forBob = await service.findAllVisibleTo('bob');
    const forAlice = await service.findAllVisibleTo('alice');

    expect(forBob.map((recipe) => recipe.title)).toEqual(['Public']);
    expect(forAlice).toHaveLength(2);
  });

  it('findOne treats another user’s private recipe as not found', async () => {
    const recipe = await service.create(
      'alice',
      buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
    );
    await expect(service.findOne(recipe.id, 'bob')).rejects.toThrow(NotFoundException);
  });

  it('findManyVisibleTo skips missing and hidden recipes', async () => {
    const visible = await service.create('alice', buildCreateRecipeDto());
    const hidden = await service.create(
      'alice',
      buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
    );

    const result = await service.findManyVisibleTo([visible.id, hidden.id, 'missing'], 'bob');

    expect(result).toEqual([visible]);
  });

  it('update lets the author edit and converts ingredient DTOs', async () => {
    const recipe = await service.create('alice', buildCreateRecipeDto());

    const updated = await service.update(recipe.id, 'alice', {
      title: 'Spicy Chicken and Rice',
      ingredients: [{ name: 'Chili', quantity: { amount: 1, unit: Unit.Teaspoon } }],
    });

    expect(updated.title).toBe('Spicy Chicken and Rice');
    expect(updated.ingredients.map((ingredient) => ingredient.name)).toEqual(['Chili']);
  });

  it('update and remove are forbidden for non-authors', async () => {
    const recipe = await service.create('alice', buildCreateRecipeDto());

    await expect(service.update(recipe.id, 'bob', { title: 'Mine now' })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.remove(recipe.id, 'bob')).rejects.toThrow(ForbiddenException);
  });

  it('review stores the reviewer’s rating on the recipe', async () => {
    const recipe = await service.create('alice', buildCreateRecipeDto());

    const reviewed = await service.review(recipe.id, 'bob', { rating: 4, comment: 'Solid' });

    expect(reviewed.averageRating).toBe(4);
    expect(reviewed.reviews[0]).toMatchObject({ reviewerId: 'bob', comment: 'Solid' });
  });

  it('review treats another user’s private recipe as not found', async () => {
    const recipe = await service.create(
      'alice',
      buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
    );

    await expect(service.review(recipe.id, 'bob', { rating: 5 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deletes the recipe', async () => {
    const recipe = await service.create('alice', buildCreateRecipeDto());

    await service.remove(recipe.id, 'alice');

    await expect(service.findOne(recipe.id, 'alice')).rejects.toThrow(NotFoundException);
  });
});
