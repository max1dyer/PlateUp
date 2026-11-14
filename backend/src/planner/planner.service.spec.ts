import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { RecipeVisibility } from '../recipes/entities/recipe.entity';
import { RecipesModule } from '../recipes/recipes.module';
import { RecipesService } from '../recipes/recipes.service';
import { buildCreateRecipeDto } from '../recipes/testing/recipe.fixtures';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { MealSlot } from './entities/planned-meal.entity';
import { PlannerService } from './planner.service';
import { InMemoryPlannedMealRepository } from './repositories/in-memory-planned-meal.repository';
import { PlannedMealRepository } from './repositories/planned-meal.repository';

describe('PlannerService', () => {
  let service: PlannerService;
  let recipes: RecipesService;
  let users: UsersService;
  let aliceId: string;
  let recipeId: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecipesModule, UsersModule],
      providers: [
        PlannerService,
        { provide: PlannedMealRepository, useClass: InMemoryPlannedMealRepository },
      ],
    }).compile();
    service = moduleRef.get(PlannerService);
    recipes = moduleRef.get(RecipesService);
    users = moduleRef.get(UsersService);
    aliceId = (await users.register({ username: 'alice', displayName: 'Alice' })).id;
    recipeId = (await recipes.create('chef', buildCreateRecipeDto({ servings: 2 }))).id;
  });

  const week = (ownerId = aliceId) => service.findBetween(ownerId, '2026-09-21', '2026-09-27');

  it('plan stores a meal with a summary of its recipe', async () => {
    const meal = await service.plan(aliceId, {
      recipeId,
      date: '2026-09-22',
      slot: MealSlot.Lunch,
      servings: 3,
    });

    expect(meal).toMatchObject({
      date: '2026-09-22',
      slot: 'lunch',
      servings: 3,
      eaten: false,
      recipe: { id: recipeId, title: 'Chicken and Rice', servings: 2 },
    });
    expect(await week()).toHaveLength(1);
  });

  it('plan uses the preferred serving size when none is given', async () => {
    await users.updatePreferences(aliceId, { defaultServings: 4 });

    const meal = await service.plan(aliceId, {
      recipeId,
      date: '2026-09-22',
      slot: MealSlot.Dinner,
    });

    expect(meal.servings).toBe(4);
  });

  it('plan falls back to the recipe’s servings for a user without preferences', async () => {
    const meal = await service.plan('unknown-user', {
      recipeId,
      date: '2026-09-22',
      slot: MealSlot.Dinner,
    });

    expect(meal.servings).toBe(2);
  });

  it('plan 404s for a recipe the user cannot see', async () => {
    const hidden = await recipes.create(
      'chef',
      buildCreateRecipeDto({ visibility: RecipeVisibility.Private }),
    );

    await expect(
      service.plan(aliceId, { recipeId: hidden.id, date: '2026-09-22', slot: MealSlot.Lunch }),
    ).rejects.toThrow(NotFoundException);
  });

  it('findBetween returns only the user’s meals in range, ordered by day and meal', async () => {
    const plan = (date: string, slot: MealSlot, ownerId = aliceId) =>
      service.plan(ownerId, { recipeId, date, slot, servings: 1 });
    await plan('2026-09-23', MealSlot.Breakfast);
    await plan('2026-09-21', MealSlot.Dinner);
    await plan('2026-09-21', MealSlot.Breakfast);
    await plan('2026-09-28', MealSlot.Lunch);
    await plan('2026-09-21', MealSlot.Lunch, 'bob');

    const meals = await week();

    expect(meals.map((meal) => `${meal.date} ${meal.slot}`)).toEqual([
      '2026-09-21 breakfast',
      '2026-09-21 dinner',
      '2026-09-23 breakfast',
    ]);
  });

  it('findBetween leaves out meals whose recipe was deleted', async () => {
    await service.plan(aliceId, { recipeId, date: '2026-09-22', slot: MealSlot.Lunch });

    await recipes.remove(recipeId, 'chef');

    expect(await week()).toEqual([]);
  });

  it('findBetween rejects invalid or oversized ranges', async () => {
    await expect(service.findBetween(aliceId, 'soon', '2026-09-27')).rejects.toThrow(
      DomainValidationError,
    );
    await expect(service.findBetween(aliceId, '2026-09-27', '2026-09-21')).rejects.toThrow(
      'The "to" date must not be before the "from" date.',
    );
    await expect(service.findBetween(aliceId, '2026-01-01', '2026-06-01')).rejects.toThrow(
      'Load at most 62 days of meals at a time.',
    );
  });

  it('update moves a meal and marks it eaten', async () => {
    const meal = await service.plan(aliceId, {
      recipeId,
      date: '2026-09-22',
      slot: MealSlot.Lunch,
    });

    const updated = await service.update(aliceId, meal.id, {
      date: '2026-09-24',
      slot: MealSlot.Dinner,
      eaten: true,
    });

    expect(updated).toMatchObject({ date: '2026-09-24', slot: 'dinner', eaten: true });
  });

  it('update and remove 404 for another user’s meal', async () => {
    const meal = await service.plan(aliceId, {
      recipeId,
      date: '2026-09-22',
      slot: MealSlot.Lunch,
    });

    await expect(service.update('bob', meal.id, { eaten: true })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove('bob', meal.id)).rejects.toThrow(NotFoundException);
  });

  it('remove takes the meal off the planner', async () => {
    const meal = await service.plan(aliceId, {
      recipeId,
      date: '2026-09-22',
      slot: MealSlot.Lunch,
    });

    await service.remove(aliceId, meal.id);

    expect(await week()).toEqual([]);
  });
});
