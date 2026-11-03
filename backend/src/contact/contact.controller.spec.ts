import { Test } from '@nestjs/testing';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

describe('ContactController', () => {
  let controller: ContactController;
  const service = { send: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: service }],
    }).compile();
    controller = moduleRef.get(ContactController);
  });

  it('send delegates the DTO', async () => {
    const dto = { name: 'Alice', email: 'a@b.co', message: 'Hello' };
    await controller.send(dto);
    expect(service.send).toHaveBeenCalledWith(dto);
  });
});
