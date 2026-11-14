import { Injectable, NotFoundException } from '@nestjs/common';
import { daysBetween, requireCalendarDate } from '../common/domain/calendar-date';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { UsersService } from '../users/users.service';
import { PlanMealDto } from './dto/plan-meal.dto';
import { PlannedMealView } from './dto/planned-meal-view';
import { UpdatePlannedMealDto } from './dto/update-planned-meal.dto';
import { PlannedMeal, compareMeals } from './entities/planned-meal.entity';
import { PlannedMealRepository } from './repositories/planned-meal.repository';

/** Longest date range one request may load (about two months), to keep responses small. */
export const MAX_RANGE_DAYS = 62;

/**
 * Use-case layer for the weekly planner (UC1, UC4): plans recipes the user can
 * see on a day and meal time, moves and removes them, and records what was
 * eaten. Responses include a summary of each meal's recipe. Recipes are read
 * through `RecipesService`, and preferred servings through `UsersService`.
 */
@Injectable()
export class PlannerService {
  constructor(
    private readonly meals: PlannedMealRepository,
    private readonly recipesService: RecipesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * The user's meals from `from` to `to` (both inclusive), ordered by day and
   * meal time. Meals whose recipe was deleted or made private are left out.
   *
   * @throws DomainValidationError if a date is invalid, `to` is before `from`,
   *   or the range is longer than `MAX_RANGE_DAYS`.
   */
  public async findBetween(
    ownerId: string,
    from: string | undefined,
    to: string | undefined,
  ): Promise<PlannedMealView[]> {
    const start = requireCalendarDate(from, 'From date');
    const end = requireCalendarDate(to, 'To date');
    const span = daysBetween(start, end);
    if (span < 0) {
      throw new DomainValidationError('The "to" date must not be before the "from" date.');
    }
    if (span >= MAX_RANGE_DAYS) {
      throw new DomainValidationError(`Load at most ${MAX_RANGE_DAYS} days of meals at a time.`);
    }
    const meals = await this.meals.findByOwnerBetween(ownerId, start, end);
    return this.withRecipes(ownerId, meals.sort(compareMeals));
  }

  /**
   * Plans a recipe the user can see for a day and meal time. Without a
   * servings count, the user's preferred serving size is used (story 2.4).
   *
   * @throws NotFoundException if the recipe is missing or private to someone else.
   */
  public async plan(ownerId: string, dto: PlanMealDto): Promise<PlannedMealView> {
    const recipe = await this.recipesService.findOne(dto.recipeId, ownerId);
    const servings = dto.servings ?? (await this.preferredServings(ownerId, recipe));
    const meal = new PlannedMeal(ownerId, recipe.id, dto.date, dto.slot, servings);
    return PlannerService.toView(await this.meals.save(meal), recipe);
  }

  /**
   * Moves a meal to another day or meal time, changes its servings, or marks
   * it eaten or not eaten.
   *
   * @throws NotFoundException if the meal is not the user's, or its recipe is no longer visible.
   */
  public async update(
    ownerId: string,
    mealId: string,
    dto: UpdatePlannedMealDto,
  ): Promise<PlannedMealView> {
    const meal = await this.findOwned(ownerId, mealId);
    meal.update(dto);
    const recipe = await this.recipesService.findOne(meal.recipeId, ownerId);
    return PlannerService.toView(await this.meals.save(meal), recipe);
  }

  /**
   * Removes a meal from the planner.
   *
   * @throws NotFoundException if it does not exist or belongs to someone else.
   */
  public async remove(ownerId: string, mealId: string): Promise<void> {
    await this.findOwned(ownerId, mealId);
    await this.meals.delete(mealId);
  }

  /** Loads one of the user's meals, reporting other users' meals as not found. */
  private async findOwned(ownerId: string, mealId: string): Promise<PlannedMeal> {
    const meal = await this.meals.findById(mealId);
    if (!meal || !meal.isOwnedBy(ownerId)) {
      throw new NotFoundException(`Planned meal ${mealId} not found.`);
    }
    return meal;
  }

  /** The user's preferred servings, or the recipe's own if their preferences can't be read. */
  private async preferredServings(ownerId: string, recipe: Recipe): Promise<number> {
    try {
      return (await this.usersService.getPreferences(ownerId)).defaultServings;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return recipe.servings;
      }
      throw error;
    }
  }

  /** Pairs each meal with its recipe, dropping meals whose recipe the user can no longer see. */
  private async withRecipes(ownerId: string, meals: PlannedMeal[]): Promise<PlannedMealView[]> {
    const ids = [...new Set(meals.map((meal) => meal.recipeId))];
    const recipes = await this.recipesService.findManyVisibleTo(ids, ownerId);
    const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    return meals.flatMap((meal) => {
      const recipe = byId.get(meal.recipeId);
      return recipe ? [PlannerService.toView(meal, recipe)] : [];
    });
  }

  /** The response for one meal: its own fields plus a summary of its recipe. */
  private static toView(meal: PlannedMeal, recipe: Recipe): PlannedMealView {
    const { title, thumbnailUrl, servings, prepTimeMinutes, nutrition } = recipe.toJSON();
    return {
      ...meal.toJSON(),
      recipe: { id: recipe.id, title, thumbnailUrl, servings, prepTimeMinutes, nutrition },
    };
  }
}
