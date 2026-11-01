import { Test } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { buildCreateRecipeDto } from './testing/recipe.fixtures';

describe('RecipesController', () => {
  let controller: RecipesController;
  const service = {
    findAllVisibleTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    review: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [{ provide: RecipesService, useValue: service }],
    }).compile();
    controller = moduleRef.get(RecipesController);
  });

  it('findAll delegates with the current user', async () => {
    service.findAllVisibleTo.mockResolvedValue([]);
    await expect(controller.findAll('alice')).resolves.toEqual([]);
    expect(service.findAllVisibleTo).toHaveBeenCalledWith('alice');
  });

  it('findOne delegates with the recipe id and current user', async () => {
    await controller.findOne('alice', 'r1');
    expect(service.findOne).toHaveBeenCalledWith('r1', 'alice');
  });

  it('create delegates the DTO with the author', async () => {
    const dto = buildCreateRecipeDto();
    await controller.create('alice', dto);
    expect(service.create).toHaveBeenCalledWith('alice', dto);
  });

  it('update delegates the changes', async () => {
    await controller.update('alice', 'r1', { title: 'New' });
    expect(service.update).toHaveBeenCalledWith('r1', 'alice', { title: 'New' });
  });

  it('review delegates the rating with the reviewer', async () => {
    await controller.review('bob', 'r1', { rating: 5, comment: 'Great' });
    expect(service.review).toHaveBeenCalledWith('r1', 'bob', { rating: 5, comment: 'Great' });
  });

  it('remove delegates the deletion', async () => {
    await controller.remove('alice', 'r1');
    expect(service.remove).toHaveBeenCalledWith('r1', 'alice');
  });
});
