import { DomainValidationError } from '../errors/domain-validation.error';

/**
 * Calendar days written as `YYYY-MM-DD` strings, with no time of day or time
 * zone. Used for pantry expiration dates and planner days, where "Tuesday the
 * 22nd" means the same day wherever the user is. Strings in this format sort
 * and compare correctly with `<` and `>`.
 */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Milliseconds in one day. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** True if `value` is a real calendar day in `YYYY-MM-DD` form (so "2026-02-30" is not). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const match = CALENDAR_DATE.exec(value);
  if (!match) {
    return false;
  }
  // Round-trip through a UTC date: an impossible day (Feb 30) rolls over and no longer matches.
  return toCalendarDate(toUtcMs(value)) === value;
}

/** Returns `value`, or throws if it is not a calendar day in `YYYY-MM-DD` form. */
export function requireCalendarDate(value: string | undefined, field: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!isCalendarDate(trimmed)) {
    throw new DomainValidationError(`${field} must be a valid date (YYYY-MM-DD).`);
  }
  return trimmed;
}

/** Like `requireCalendarDate`, but null or blank means "no date" and gives null. */
export function requireCalendarDateOrNull(
  value: string | null | undefined,
  field: string,
): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }
  return requireCalendarDate(value, field);
}

/** The day `days` after `date` (or before it, when negative). */
export function addDays(date: string, days: number): string {
  return toCalendarDate(toUtcMs(date) + days * DAY_MS);
}

/** Whole days from `from` to `to`: positive when `to` is later, negative when earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Midnight UTC on `date`; UTC avoids daylight-saving shifts when counting days. */
function toUtcMs(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** The `YYYY-MM-DD` day of a UTC timestamp. */
function toCalendarDate(utcMs: number): string {
  const date = new Date(utcMs);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}
