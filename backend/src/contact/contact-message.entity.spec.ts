import { DomainValidationError } from '../common/errors/domain-validation.error';
import {
  ContactMessage,
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_NAME_LENGTH,
} from './entities/contact-message.entity';

describe('ContactMessage', () => {
  it('trims its fields and serializes them', () => {
    const message = new ContactMessage('  Alice ', ' alice@example.com ', ' Love the app! ');

    expect(message.toJSON()).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Love the app!',
    });
  });

  it.each([
    ['', 'a@b.co', 'Hi', 'Name is required.'],
    ['Alice', '', 'Hi', 'Email is required.'],
    ['Alice', 'not-an-email', 'Hi', 'Email must be a valid email address.'],
    ['Alice', 'a@b.co', '   ', 'Message is required.'],
  ])('rejects name %p, email %p, message %p', (name, email, text, error) => {
    expect(() => new ContactMessage(name, email, text)).toThrow(new DomainValidationError(error));
  });

  it('rejects a name or message that is too long', () => {
    expect(
      () => new ContactMessage('x'.repeat(MAX_CONTACT_NAME_LENGTH + 1), 'a@b.co', 'Hi'),
    ).toThrow(DomainValidationError);
    expect(
      () => new ContactMessage('Alice', 'a@b.co', 'x'.repeat(MAX_CONTACT_MESSAGE_LENGTH + 1)),
    ).toThrow(DomainValidationError);
  });
});
