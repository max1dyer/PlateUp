import { DomainValidationError } from '../errors/domain-validation.error';
import {
  addDays,
  daysBetween,
  isCalendarDate,
  requireCalendarDate,
  requireCalendarDateOrNull,
} from './calendar-date';

describe('calendar dates', () => {
  it('isCalendarDate accepts real days and rejects impossible or malformed ones', () => {
    expect(isCalendarDate('2026-09-21')).toBe(true);
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(isCalendarDate('2026-9-21')).toBe(false);
    expect(isCalendarDate('Sep 21')).toBe(false);
    expect(isCalendarDate(20260921)).toBe(false);
  });

  it('requireCalendarDate trims a valid date and rejects an invalid one', () => {
    expect(requireCalendarDate(' 2026-09-21 ', 'Date')).toBe('2026-09-21');
    expect(() => requireCalendarDate('2026-02-30', 'Expiration date')).toThrow(
      new DomainValidationError('Expiration date must be a valid date (YYYY-MM-DD).'),
    );
    expect(() => requireCalendarDate(undefined, 'Date')).toThrow(DomainValidationError);
  });

  it('requireCalendarDateOrNull treats null and blank as no date', () => {
    expect(requireCalendarDateOrNull(null, 'Date')).toBeNull();
    expect(requireCalendarDateOrNull(undefined, 'Date')).toBeNull();
    expect(requireCalendarDateOrNull('  ', 'Date')).toBeNull();
    expect(requireCalendarDateOrNull('2026-09-21', 'Date')).toBe('2026-09-21');
    expect(() => requireCalendarDateOrNull('tomorrow', 'Date')).toThrow(DomainValidationError);
  });

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-09-28', 7)).toBe('2026-10-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysBetween counts whole days in either direction', () => {
    expect(daysBetween('2026-09-21', '2026-09-28')).toBe(7);
    expect(daysBetween('2026-09-28', '2026-09-21')).toBe(-7);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  });
});
