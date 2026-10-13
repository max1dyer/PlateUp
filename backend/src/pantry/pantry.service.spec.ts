import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Quantity, Unit } from '../common/domain/quantity';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { PantryService } from './pantry.service';
import { InMemoryPantryItemRepository } from './repositories/in-memory-pantry-item.repository';
import { PantryItemRepository } from './repositories/pantry-item.repository';

describe('PantryService', () => {
  let service: PantryService;
  const eggs = { name: 'Eggs', quantity: { amount: 12, unit: Unit.Piece } };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PantryService,
        { provide: PantryItemRepository, useClass: InMemoryPantryItemRepository },
      ],
    }).compile();
    service = moduleRef.get(PantryService);
  });

  it('add stores an item that only its owner can see', async () => {
    await service.add('alice', eggs);

    expect(await service.findAll('alice')).toHaveLength(1);
    expect(await service.findAll('bob')).toHaveLength(0);
  });

  it('add rejects invalid quantities', async () => {
    await expect(
      service.add('alice', { name: 'Eggs', quantity: { amount: -1, unit: Unit.Piece } }),
    ).rejects.toThrow(DomainValidationError);
  });

  it('update renames and changes the quantity', async () => {
    const item = await service.add('alice', eggs);

    const updated = await service.update('alice', item.id, {
      name: 'Large eggs',
      quantity: { amount: 6, unit: Unit.Piece },
    });

    expect(updated.name).toBe('Large eggs');
    expect(updated.quantity.equals(new Quantity(6, Unit.Piece))).toBe(true);
  });

  it('update and remove 404 for another user’s item', async () => {
    const item = await service.add('alice', eggs);

    await expect(service.update('bob', item.id, { name: 'Mine' })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove('bob', item.id)).rejects.toThrow(NotFoundException);
  });

  it('remove deletes the item', async () => {
    const item = await service.add('alice', eggs);

    await service.remove('alice', item.id);

    expect(await service.findAll('alice')).toHaveLength(0);
  });
});
