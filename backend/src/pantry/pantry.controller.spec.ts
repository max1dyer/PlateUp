import { Test } from '@nestjs/testing';
import { Unit } from '../common/domain/quantity';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';

describe('PantryController', () => {
  let controller: PantryController;
  const service = {
    findAll: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PantryController],
      providers: [{ provide: PantryService, useValue: service }],
    }).compile();
    controller = moduleRef.get(PantryController);
  });

  it('findAll delegates with the current user', async () => {
    service.findAll.mockResolvedValue([]);
    await expect(controller.findAll('alice')).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith('alice');
  });

  it('add delegates the DTO', async () => {
    const dto = { name: 'Eggs', quantity: { amount: 12, unit: Unit.Piece } };
    await controller.add('alice', dto);
    expect(service.add).toHaveBeenCalledWith('alice', dto);
  });

  it('update delegates the changes', async () => {
    await controller.update('alice', 'p1', { name: 'Large eggs' });
    expect(service.update).toHaveBeenCalledWith('alice', 'p1', { name: 'Large eggs' });
  });

  it('remove delegates the deletion', async () => {
    await controller.remove('alice', 'p1');
    expect(service.remove).toHaveBeenCalledWith('alice', 'p1');
  });
});
