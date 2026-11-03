import { Injectable } from '@nestjs/common';
import { InMemoryRepository } from '../../common/persistence/in-memory.repository';
import { ContactMessage } from '../entities/contact-message.entity';
import { ContactMessageRepository } from './contact-message.repository';

@Injectable()
export class InMemoryContactMessageRepository
  extends InMemoryRepository<ContactMessage>
  implements ContactMessageRepository {}
