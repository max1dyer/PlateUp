import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Unit } from '../common/domain/quantity';
import { GroceryListsService } from './grocery-lists.service';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { InMemoryGroceryListRepository } from './repositories/in-memory-grocery-list.repository';

describe('GroceryListsService', () => {
  let service: GroceryListsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GroceryListsService,
        { provide: GroceryListRepository, useClass: InMemoryGroceryListRepository },
      ],
    }).compile();
    service = moduleRef.get(GroceryListsService);
  });

  it('create and findAll are scoped to the owner', async () => {
    await service.create('alice', { name: 'Weekly' });

    expect(await service.findAll('alice')).toHaveLength(1);
    expect(await service.findAll('bob')).toHaveLength(0);
  });

  it('findOne 404s for another user’s list', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await expect(service.findOne('bob', list.id)).rejects.toThrow(NotFoundException);
  });

  it('rename changes the list name', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    const renamed = await service.rename('alice', list.id, { name: 'Party' });
    expect(renamed.name).toBe('Party');
  });

  it('addItem converts the optional quantity', async () => {
    const list = await service.create('alice', { name: 'Weekly' });

    await service.addItem('alice', list.id, { name: 'Chips' });
    const updated = await service.addItem('alice', list.id, {
      name: 'Milk',
      quantity: { amount: 1, unit: Unit.Liter },
    });

    expect(updated.items.map((item) => item.quantity?.unit ?? null)).toEqual([null, Unit.Liter]);
  });

  it('updateItem, removeItem and removePurchasedItems manage items', async () => {
    const list = await service.create('alice', { name: 'Weekly' });
    await service.addItem('alice', list.id, { name: 'Milk' });
    await service.addItem('alice', list.id, { name: 'Bread' });
    const [milk, bread] = list.items;

    await service.updateItem('alice', list.id, milk.id, { purchased: true });
    await service.removePurchasedItems('alice', list.id);
    expect(list.items).toEqual([bread]);

    await service.removeItem('alice', list.id, bread.id);
    expect(list.items).toHaveLength(0);
  });

  it('item operations 404 for unknown items', async () => {
    const list = await service.create('alice', { name: 'Weekly' });

    await expect(
      service.updateItem('alice', list.id, 'missing', { purchased: true }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.removeItem('alice', list.id, 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deletes the list', async () => {
    const list = await service.create('alice', { name: 'Weekly' });

    await service.remove('alice', list.id);

    await expect(service.findOne('alice', list.id)).rejects.toThrow(NotFoundException);
  });
});
