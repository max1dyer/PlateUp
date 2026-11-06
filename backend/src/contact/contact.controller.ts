import { Body, Controller, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
import { ContactMessage } from './entities/contact-message.entity';

/** Public endpoint (no sign-in needed) behind the Contact page's form. */
@Controller('contact-messages')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  public send(@Body() dto: SendContactMessageDto): Promise<ContactMessage> {
    return this.contactService.send(dto);
  }
}
