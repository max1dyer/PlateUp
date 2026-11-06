import { BaseEntity } from '../../common/domain/base.entity';
import { requireEmail, requireMaxLength, requireText } from '../../common/domain/guards';

export const MAX_CONTACT_NAME_LENGTH = 100;
export const MAX_CONTACT_MESSAGE_LENGTH = 2000;

export interface ContactMessageSnapshot {
  name: string;
  email: string;
  message: string;
}

/**
 * A message a visitor sent the team from the Contact page. It is stored, not
 * emailed, until the team picks an email provider.
 */
export class ContactMessage extends BaseEntity<ContactMessageSnapshot> {
  public readonly name: string;
  public readonly email: string;
  public readonly message: string;

  constructor(name: string, email: string, message: string) {
    super();
    this.name = requireMaxLength(requireText(name, 'Name'), MAX_CONTACT_NAME_LENGTH, 'Name');
    this.email = requireEmail(email, 'Email');
    this.message = requireMaxLength(
      requireText(message, 'Message'),
      MAX_CONTACT_MESSAGE_LENGTH,
      'Message',
    );
  }

  protected snapshot(): ContactMessageSnapshot {
    return { name: this.name, email: this.email, message: this.message };
  }
}
