/**
 * Thrown by domain objects when an operation would break one of their rules
 * (e.g. a negative quantity). Mapped to HTTP 400 by DomainErrorFilter.
 */
export class DomainValidationError extends Error {
  /** @param message - User-facing explanation, returned as the 400 response's `message`. */
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}
