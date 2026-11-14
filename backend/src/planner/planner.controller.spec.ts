import { Test } from '@nestjs/testing';
import { MealSlot } from './entities/planned-meal.entity';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';

describe('PlannerController', () => {
  let controller: PlannerController;
  const service = {
    findBetween: jest.fn(),
    plan: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PlannerController],
      providers: [{ provide: PlannerService, useValue: service }],
    }).compile();
    controller = moduleRef.get(PlannerController);
  });

  it('findBetween passes the user and the date range', async () => {
    service.findBetween.mockResolvedValue([]);

    await expect(controller.findBetween('alice', '2026-09-21', '2026-09-27')).resolves.toEqual([]);
    expect(service.findBetween).toHaveBeenCalledWith('alice', '2026-09-21', '2026-09-27');
  });

  it('plan, update, and remove delegate with the current user', async () => {
    const dto = { recipeId: 'r1', date: '2026-09-22', slot: MealSlot.Lunch };

    await controller.plan('alice', dto);
    await controller.update('alice', 'm1', { eaten: true });
    await controller.remove('alice', 'm1');

    expect(service.plan).toHaveBeenCalledWith('alice', dto);
    expect(service.update).toHaveBeenCalledWith('alice', 'm1', { eaten: true });
    expect(service.remove).toHaveBeenCalledWith('alice', 'm1');
  });
});
