import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const service = {
    register: jest.fn(),
    findOne: jest.fn(),
    updateProfile: jest.fn(),
    getSavedRecipes: jest.fn(),
    saveRecipe: jest.fn(),
    unsaveRecipe: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
  });

  it('register delegates the DTO', async () => {
    const dto = { username: 'peter', displayName: 'Peter' };
    await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('findMe and findOne look up the right user', async () => {
    await controller.findMe('alice');
    await controller.findOne('bob');

    expect(service.findOne).toHaveBeenNthCalledWith(1, 'alice');
    expect(service.findOne).toHaveBeenNthCalledWith(2, 'bob');
  });

  it('updateMe delegates profile changes', async () => {
    await controller.updateMe('alice', { bio: 'Hi' });
    expect(service.updateProfile).toHaveBeenCalledWith('alice', { bio: 'Hi' });
  });

  it('saved-recipe routes delegate with the current user', async () => {
    service.getSavedRecipes.mockResolvedValue([]);
    await expect(controller.getSavedRecipes('alice')).resolves.toEqual([]);
    await controller.saveRecipe('alice', 'r1');
    await controller.unsaveRecipe('alice', 'r1');

    expect(service.getSavedRecipes).toHaveBeenCalledWith('alice');
    expect(service.saveRecipe).toHaveBeenCalledWith('alice', 'r1');
    expect(service.unsaveRecipe).toHaveBeenCalledWith('alice', 'r1');
  });
});
