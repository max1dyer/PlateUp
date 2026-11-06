import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactMessageRepository } from './repositories/contact-message.repository';
import { InMemoryContactMessageRepository } from './repositories/in-memory-contact-message.repository';

@Module({
  controllers: [ContactController],
  providers: [
    ContactService,
    { provide: ContactMessageRepository, useClass: InMemoryContactMessageRepository },
  ],
})
export class ContactModule {}
