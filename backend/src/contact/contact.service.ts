import { Injectable } from '@nestjs/common';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactMessageRepository } from './repositories/contact-message.repository';

/** Receives messages from the Contact page. Sending them by email comes later. */
@Injectable()
export class ContactService {
  constructor(private readonly messages: ContactMessageRepository) {}

  /** Validates the message (through the `ContactMessage` entity) and stores it. */
  public async send(dto: SendContactMessageDto): Promise<ContactMessage> {
    return this.messages.save(new ContactMessage(dto.name, dto.email, dto.message));
  }
}
