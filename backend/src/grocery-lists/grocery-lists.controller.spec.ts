import { Test } from '@nestjs/testing';
import { GroceryListsController } from './grocery-lists.controller';
import { GroceryListsService } from './grocery-lists.service';

describe('GroceryListsController', () => {
  let controller: GroceryListsController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
    remove: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    removePurchasedItems: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [GroceryListsController],
      providers: [{ provide: GroceryListsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(GroceryListsController);
  });

  it('findAll and findOne delegate with the current user', async () => {
    service.findAll.mockResolvedValue([]);
    await expect(controller.findAll('alice')).resolves.toEqual([]);
    await controller.findOne('alice', 'l1');

    expect(service.findAll).toHaveBeenCalledWith('alice');
    expect(service.findOne).toHaveBeenCalledWith('alice', 'l1');
  });

  it('create, rename and remove delegate list changes', async () => {
    await controller.create('alice', { name: 'Weekly' });
    await controller.rename('alice', 'l1', { name: 'Party' });
    await controller.remove('alice', 'l1');

    expect(service.create).toHaveBeenCalledWith('alice', { name: 'Weekly' });
    expect(service.rename).toHaveBeenCalledWith('alice', 'l1', { name: 'Party' });
    expect(service.remove).toHaveBeenCalledWith('alice', 'l1');
  });

  it('item routes delegate item changes', async () => {
    await controller.addItem('alice', 'l1', { name: 'Milk' });
    await controller.updateItem('alice', 'l1', 'i1', { purchased: true });
    await controller.removeItem('alice', 'l1', 'i1');
    await controller.removePurchasedItems('alice', 'l1');

    expect(service.addItem).toHaveBeenCalledWith('alice', 'l1', { name: 'Milk' });
    expect(service.updateItem).toHaveBeenCalledWith('alice', 'l1', 'i1', { purchased: true });
    expect(service.removeItem).toHaveBeenCalledWith('alice', 'l1', 'i1');
    expect(service.removePurchasedItems).toHaveBeenCalledWith('alice', 'l1');
  });
});
