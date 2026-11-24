import { repositoryProvider, StorageModule } from '../common/persistence/storage.module';
import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactMessageRepository } from './repositories/contact-message.repository';
import { PostgresContactMessageRepository } from './repositories/postgres-contact-message.repository';
import { InMemoryContactMessageRepository } from './repositories/in-memory-contact-message.repository';

/** Contact feature: the public contact-form route, its service, and storage binding. */
@Module({
  imports: [StorageModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    repositoryProvider(
      ContactMessageRepository,
      InMemoryContactMessageRepository,
      PostgresContactMessageRepository,
    ),
  ],
})
export class ContactModule {}
