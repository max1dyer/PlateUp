import { pantryItem } from './pantry.fixtures';
import { expiringItems, expiryAlert, expiryStatus } from './pantry-expiry';

describe('pantry expiry', () => {
  const today = '2026-09-21';

  it('expiryStatus flags expired and soon-to-expire dates', () => {
    expect(expiryStatus(null, today)).toEqual({ state: 'none', daysLeft: null, label: '' });
    expect(expiryStatus('2026-09-20', today)).toEqual({
      state: 'expired',
      daysLeft: -1,
      label: 'Expired',
    });
    expect(expiryStatus('2026-09-21', today).label).toBe('Expires today');
    expect(expiryStatus('2026-09-22', today).label).toBe('Expires tomorrow');
    expect(expiryStatus('2026-09-27', today)).toEqual({
      state: 'soon',
      daysLeft: 6,
      label: 'Expires in 6 days',
    });
  });

  it('expiryStatus treats a week or more away as fresh', () => {
    expect(expiryStatus('2026-09-28', today)).toEqual({ state: 'fresh', daysLeft: 7, label: '' });
  });

  it('expiringItems lists only items needing attention, earliest first', () => {
    const items = [
      pantryItem({ id: 'a', name: 'Rice', expiresOn: null }),
      pantryItem({ id: 'b', name: 'Milk', expiresOn: '2026-09-24' }),
      pantryItem({ id: 'c', name: 'Yogurt', expiresOn: '2026-09-19' }),
      pantryItem({ id: 'd', name: 'Oats', expiresOn: '2026-12-01' }),
    ];

    expect(expiringItems(items, today).map((item) => item.name)).toEqual(['Yogurt', 'Milk']);
  });

  it('expiryAlert summarizes the count, or gives null when nothing is expiring', () => {
    const milk = pantryItem({ id: 'b', name: 'Milk', expiresOn: '2026-09-24' });
    const yogurt = pantryItem({ id: 'c', name: 'Yogurt', expiresOn: '2026-09-19' });

    expect(expiryAlert([], today)).toBeNull();
    expect(expiryAlert([pantryItem({ expiresOn: '2026-12-01' })], today)).toBeNull();
    expect(expiryAlert([milk], today)).toBe(
      '1 item in your pantry has expired or expires within 7 days.',
    );
    expect(expiryAlert([milk, yogurt], today)).toBe(
      '2 items in your pantry have expired or expire within 7 days.',
    );
  });
});
