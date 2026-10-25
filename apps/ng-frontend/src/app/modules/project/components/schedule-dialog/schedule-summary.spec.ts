import { describe, expect, it } from 'vitest';
import { scheduleSummary } from './schedule-summary';

describe('scheduleSummary', () => {
  it('summarizes each preset', () => {
    expect(
      scheduleSummary({
        kind: 'daily',
        time: '09:00',
        weekdays: null,
        everyHours: null
      })
    ).toBe('Daily at 09:00');
    expect(
      scheduleSummary({
        kind: 'weekly',
        time: '18:30',
        weekdays: [0, 1, 3],
        everyHours: null
      })
    ).toBe('Mon, Wed, Sun at 18:30');
    expect(
      scheduleSummary({
        kind: 'everyHours',
        time: null,
        weekdays: null,
        everyHours: 6
      })
    ).toBe('Every 6 hours');
    expect(
      scheduleSummary({
        kind: 'everyHours',
        time: null,
        weekdays: null,
        everyHours: 1
      })
    ).toBe('Every hour');
  });
});
