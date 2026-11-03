import { Test } from '@nestjs/testing';
import { DomainValidationError } from '../common/errors/domain-validation.error';
import { ContactService } from './contact.service';
import { ContactMessageRepository } from './repositories/contact-message.repository';
import { InMemoryContactMessageRepository } from './repositories/in-memory-contact-message.repository';

describe('ContactService', () => {
  let service: ContactService;
  let messages: ContactMessageRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: ContactMessageRepository, useClass: InMemoryContactMessageRepository },
      ],
    }).compile();
    service = moduleRef.get(ContactService);
    messages = moduleRef.get(ContactMessageRepository);
  });

  it('send stores the message', async () => {
    const sent = await service.send({ name: 'Alice', email: 'a@b.co', message: 'Hello' });

    expect(await messages.findById(sent.id)).toBe(sent);
  });

  it('send refuses an invalid message and stores nothing', async () => {
    await expect(service.send({ name: 'Alice', email: 'nope', message: 'Hi' })).rejects.toThrow(
      DomainValidationError,
    );
    expect(await messages.findAll()).toHaveLength(0);
  });
});
