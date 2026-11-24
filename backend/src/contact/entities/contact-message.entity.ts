import { BaseEntity, EntityRecord } from '../../common/domain/base.entity';
import { requireEmail, requireMaxLength, requireText } from '../../common/domain/guards';

/** Longest accepted sender name and message, in characters. */
export const MAX_CONTACT_NAME_LENGTH = 100;
export const MAX_CONTACT_MESSAGE_LENGTH = 2000;

/** The fields a contact message serializes to. */
export interface ContactMessageSnapshot {
  name: string;
  email: string;
  message: string;
}

/** A contact message's stored state (the same fields it serializes to). */
export type ContactMessageRecord = EntityRecord & ContactMessageSnapshot;

/**
 * A message a visitor sent the team from the Contact page. It is stored, not
 * emailed, until the team picks an email provider.
 */
export class ContactMessage extends BaseEntity<ContactMessageSnapshot> {
  public readonly name: string;
  public readonly email: string;
  public readonly message: string;

  /** @throws DomainValidationError if a field is blank or too long, or the email is malformed. */
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

  /** Rebuilds a stored message with its id and timestamps. */
  public static fromRecord(record: ContactMessageRecord): ContactMessage {
    return new ContactMessage(record.name, record.email, record.message).restoreIdentity(record);
  }

  /** The message's complete state as plain data (see `BaseEntity.toRecord`). */
  public toRecord(): ContactMessageRecord {
    return { ...this.identityRecord(), ...this.snapshot() };
  }

  /** The message-specific fields for `toJSON()`. */
  protected snapshot(): ContactMessageSnapshot {
    return { name: this.name, email: this.email, message: this.message };
  }
}
