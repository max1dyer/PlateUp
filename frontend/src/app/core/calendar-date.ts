/**
 * Calendar days as `YYYY-MM-DD` strings, the same format the backend stores
 * for pantry expiration dates and planner days. Day arithmetic uses UTC so a
 * daylight-saving change never makes a day 23 or 25 hours long.
 */

/** Milliseconds in one day. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in the user's own time zone. */
export function today(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The day `days` after `date` (or before it, when negative). */
export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Whole days from `from` to `to`: positive when `to` is later, negative when earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Day of the week for `date`: 0 for Sunday through 6 for Saturday. */
export function dayOfWeek(date: string): number {
  return new Date(toUtcMs(date)).getUTCDay();
}

/** The Monday on or before `date`, which starts its planner week. */
export function startOfWeek(date: string): string {
  // getUTCDay() counts from Sunday, so shift it to count from Monday (Mon = 0 ... Sun = 6).
  return addDays(date, -((dayOfWeek(date) + 6) % 7));
}

/**
 * A local `Date` at noon on `date`, for formatting with `DatePipe` or `Intl`.
 * Noon keeps the day the same in every time zone the browser might use.
 */
export function toLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Midnight UTC on `date`. */
function toUtcMs(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** The `YYYY-MM-DD` day of a UTC timestamp. */
function fromUtcMs(utcMs: number): string {
  const date = new Date(utcMs);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}
