import { Repository } from '../../common/persistence/repository';
import { ContactMessage } from '../entities/contact-message.entity';

/** DI token and contract for storing messages sent from the Contact page. */
export abstract class ContactMessageRepository extends Repository<ContactMessage> {}
