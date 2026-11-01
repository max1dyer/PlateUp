import { DomainValidationError } from '../errors/domain-validation.error';

/** Trims and returns `value`, or throws if it is missing or blank. */
export function requireText(value: string | undefined, field: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) {
    throw new DomainValidationError(`${field} is required.`);
  }
  return trimmed;
}

/** Trims and returns `value` (blank allowed), or throws if it is longer than `max` characters. */
export function requireMaxLength(value: string | undefined, max: number, field: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length > max) {
    throw new DomainValidationError(`${field} must be at most ${max} characters.`);
  }
  return trimmed;
}

/** Image sources accepted for pictures: web addresses or uploaded images as data URLs. */
const IMAGE_SOURCE = /^(https?:\/\/\S+|data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+)$/;

/** Returns `value` (null or blank means "no image"), or throws if it is not an image source. */
export function requireImageSourceOrNull(
  value: string | null | undefined,
  field: string,
): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) {
    return null;
  }
  if (!IMAGE_SOURCE.test(trimmed)) {
    throw new DomainValidationError(`${field} must be a web address or an uploaded image.`);
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

/** Returns `value`, or throws if it is not a whole number from `min` to `max` inclusive. */
export function requireIntegerInRange(
  value: number,
  min: number,
  max: number,
  field: string,
): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new DomainValidationError(`${field} must be a whole number from ${min} to ${max}.`);
  }
  return value;
}

/** Returns `value`, or throws if it is not one of the values of the string enum `allowed`. */
export function requireOneOf<T extends string>(
  value: T,
  allowed: Record<string, T>,
  field: string,
): T {
  if (!Object.values(allowed).includes(value)) {
    throw new DomainValidationError(`Unknown ${field} "${String(value)}".`);
  }
  return value;
}

/** Returns `value`, or throws if it is not exactly true or false. */
export function requireBoolean(value: boolean, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new DomainValidationError(`${field} must be true or false.`);
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
