import { daysBetween } from '../core/calendar-date';
import { PantryItem } from './pantry.models';

/** Items expiring in fewer than this many days are flagged and trigger the alert (UC15). */
export const EXPIRY_WARNING_DAYS = 7;

/**
 * Where an item stands against its expiration date:
 * - `expired`: the date has passed;
 * - `soon`: it expires within `EXPIRY_WARNING_DAYS` (today included);
 * - `fresh`: it expires later than that;
 * - `none`: no date was given.
 */
export type ExpiryState = 'expired' | 'soon' | 'fresh' | 'none';

/** An item's expiry state with the marker text shown beside it. */
export interface ExpiryStatus {
  state: ExpiryState;
  /** Days until the expiration date (negative once it has passed); null without a date. */
  daysLeft: number | null;
  /** Short marker such as "Expired", "Expires today", or "Expires in 3 days"; '' when fresh or undated. */
  label: string;
}

/** How close `expiresOn` is to `today` (both `YYYY-MM-DD`). */
export function expiryStatus(expiresOn: string | null, today: string): ExpiryStatus {
  if (expiresOn === null) {
    return { state: 'none', daysLeft: null, label: '' };
  }
  const daysLeft = daysBetween(today, expiresOn);
  if (daysLeft < 0) {
    return { state: 'expired', daysLeft, label: 'Expired' };
  }
  if (daysLeft >= EXPIRY_WARNING_DAYS) {
    return { state: 'fresh', daysLeft, label: '' };
  }
  const label =
    daysLeft === 0
      ? 'Expires today'
      : daysLeft === 1
        ? 'Expires tomorrow'
        : `Expires in ${daysLeft} days`;
  return { state: 'soon', daysLeft, label };
}

/** True if the item has expired or expires within the warning window. */
export function needsAttention(item: PantryItem, today: string): boolean {
  const { state } = expiryStatus(item.expiresOn, today);
  return state === 'expired' || state === 'soon';
}

/** The items that have expired or expire soon, most urgent (earliest date) first. */
export function expiringItems(items: readonly PantryItem[], today: string): PantryItem[] {
  return items
    .filter((item) => needsAttention(item, today))
    .sort((a, b) => (a.expiresOn ?? '').localeCompare(b.expiresOn ?? ''));
}

/**
 * The alert summary for a pantry, e.g. "3 items in your pantry have expired or
 * expire within 7 days.", or null when nothing needs attention.
 */
export function expiryAlert(items: readonly PantryItem[], today: string): string | null {
  const count = expiringItems(items, today).length;
  if (count === 0) {
    return null;
  }
  return count === 1
    ? `1 item in your pantry has expired or expires within ${EXPIRY_WARNING_DAYS} days.`
    : `${count} items in your pantry have expired or expire within ${EXPIRY_WARNING_DAYS} days.`;
}
