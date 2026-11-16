import { Test } from '@nestjs/testing';
import { RecipeSharesController } from './recipe-shares.controller';
import { RecipeSharesService } from './recipe-shares.service';

describe('RecipeSharesController', () => {
  let controller: RecipeSharesController;
  const service = {
    findReceived: jest.fn(),
    findShares: jest.fn(),
    share: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [RecipeSharesController],
      providers: [{ provide: RecipeSharesService, useValue: service }],
    }).compile();
    controller = moduleRef.get(RecipeSharesController);
  });

  it('routes delegate with the current user', async () => {
    await controller.findReceived('bob');
    await controller.findShares('peter', 'r1');
    await controller.share('peter', 'r1', { recipientUsername: 'bob' });
    await controller.revoke('peter', 'r1', 'u2');

    expect(service.findReceived).toHaveBeenCalledWith('bob');
    expect(service.findShares).toHaveBeenCalledWith('peter', 'r1');
    expect(service.share).toHaveBeenCalledWith('peter', 'r1', { recipientUsername: 'bob' });
    expect(service.revoke).toHaveBeenCalledWith('peter', 'r1', 'u2');
  });
});
