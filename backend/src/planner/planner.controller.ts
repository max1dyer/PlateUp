import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { PlanMealDto } from './dto/plan-meal.dto';
import { PlannedMealView } from './dto/planned-meal-view';
import { UpdatePlannedMealDto } from './dto/update-planned-meal.dto';
import { PlannerService } from './planner.service';

/** HTTP routes under `/planner` for the signed-in user's weekly meal plan. */
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  /** `GET /planner/meals?from=YYYY-MM-DD&to=YYYY-MM-DD`: the meals planned in that range. */
  @Get('meals')
  public findBetween(
    @CurrentUserId() userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<PlannedMealView[]> {
    return this.plannerService.findBetween(userId, from, to);
  }

  /** `POST /planner/meals`: plans a recipe for a day and meal time. */
  @Post('meals')
  public plan(@CurrentUserId() userId: string, @Body() dto: PlanMealDto): Promise<PlannedMealView> {
    return this.plannerService.plan(userId, dto);
  }

  /** `PATCH /planner/meals/:mealId`: moves a meal, changes its servings, or marks it eaten. */
  @Patch('meals/:mealId')
  public update(
    @CurrentUserId() userId: string,
    @Param('mealId') mealId: string,
    @Body() dto: UpdatePlannedMealDto,
  ): Promise<PlannedMealView> {
    return this.plannerService.update(userId, mealId, dto);
  }

  /** `DELETE /planner/meals/:mealId`: removes a meal and responds 204 No Content. */
  @Delete('meals/:mealId')
  @HttpCode(204)
  public remove(@CurrentUserId() userId: string, @Param('mealId') mealId: string): Promise<void> {
    return this.plannerService.remove(userId, mealId);
  }
}
