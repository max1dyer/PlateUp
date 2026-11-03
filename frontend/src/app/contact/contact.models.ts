/** Limits enforced by the backend's `ContactMessage` entity. */
export const MAX_CONTACT_NAME_LENGTH = 100;
export const MAX_CONTACT_MESSAGE_LENGTH = 2000;

/** What the Contact page's form sends. */
export interface NewContactMessage {
  name: string;
  email: string;
  message: string;
}

/** A message as stored by the backend. */
export interface ContactMessage extends NewContactMessage {
  id: string;
  createdAt: string;
  updatedAt: string;
}
