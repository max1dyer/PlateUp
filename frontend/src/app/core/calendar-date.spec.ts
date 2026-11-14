import { addDays, dayOfWeek, daysBetween, startOfWeek, toLocalDate, today } from './calendar-date';

describe('calendar dates', () => {
  it('today uses the local date', () => {
    expect(today(new Date(2026, 8, 21, 23, 30))).toBe('2026-09-21');
    expect(today(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-09-28', 7)).toBe('2026-10-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysBetween counts whole days in either direction', () => {
    expect(daysBetween('2026-09-21', '2026-09-28')).toBe(7);
    expect(daysBetween('2026-09-28', '2026-09-21')).toBe(-7);
  });

  it('startOfWeek finds the Monday on or before a date', () => {
    expect(dayOfWeek('2026-09-21')).toBe(1);
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21');
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21');
    expect(startOfWeek('2026-10-01')).toBe('2026-09-28');
  });

  it('toLocalDate gives a Date on the same local day', () => {
    const date = toLocalDate('2026-09-21');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 21]);
  });
});
