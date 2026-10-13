import { DomainValidationError } from '../errors/domain-validation.error';

/** Trims and returns `value`, or throws if it is missing or blank. */
export function requireText(value: string | undefined, field: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) {
    throw new DomainValidationError(`${field} is required.`);
  }
  return trimmed;
}

/** Returns `value`, or throws if it is not a whole number greater than zero. */
export function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainValidationError(`${field} must be a positive whole number.`);
  }
  return value;
}

/** Returns `value`, or throws if it is not a finite number of at least zero. */
export function requireNonNegative(value: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new DomainValidationError(`${field} must be a non-negative number.`);
  }
  return value;
}
