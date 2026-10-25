import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SchedulePreset } from '../types/tag-check/schedule.type';
import { computeNextRunAt, validateSchedulePreset } from './schedule-preset';

const HOUR_MS = 60 * 60 * 1000;

function daily(time: string): SchedulePreset {
  return { kind: 'daily', time, weekdays: null, everyHours: null };
}

function weekly(time: string, weekdays: number[]): SchedulePreset {
  return { kind: 'weekly', time, weekdays, everyHours: null };
}

function everyHours(hours: number): SchedulePreset {
  return { kind: 'everyHours', time: null, weekdays: null, everyHours: hours };
}

/** A local time, as the backend machine reads it. */
function local(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0
) {
  return new Date(year, month - 1, day, hours, minutes);
}

function wallClock(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// New York changes clocks on 2026-03-08 (02:00 -> 03:00) and on 2026-11-01
// (02:00 -> 01:00). Node reads TZ again whenever it is assigned.
const originalTimeZone = process.env['TZ'];
beforeAll(() => {
  process.env['TZ'] = 'America/New_York';
});
afterAll(() => {
  if (originalTimeZone === undefined) {
    delete process.env['TZ'];
  } else {
    process.env['TZ'] = originalTimeZone;
  }
});

describe('computeNextRunAt', () => {
  describe('daily', () => {
    it('runs later today when the time has not come yet', () => {
      const next = computeNextRunAt(daily('09:30'), local(2026, 10, 21, 8));
      expect(wallClock(next)).toBe('2026-10-21 09:30');
    });

    it('runs tomorrow once the time has passed, or is now', () => {
      expect(
        wallClock(computeNextRunAt(daily('09:30'), local(2026, 10, 21, 10)))
      ).toBe('2026-10-22 09:30');
      expect(
        wallClock(computeNextRunAt(daily('09:30'), local(2026, 10, 21, 9, 30)))
      ).toBe('2026-10-22 09:30');
    });

    it('crosses midnight, the end of a month and the end of a year', () => {
      expect(
        wallClock(computeNextRunAt(daily('00:10'), local(2026, 12, 31, 23, 50)))
      ).toBe('2027-01-01 00:10');
      expect(
        wallClock(computeNextRunAt(daily('00:00'), local(2026, 10, 31, 0, 1)))
      ).toBe('2026-11-01 00:00');
    });

    it('keeps the wall-clock time across the spring DST change', () => {
      const after = local(2026, 3, 7, 12);
      const next = computeNextRunAt(daily('09:00'), after);

      expect(wallClock(next)).toBe('2026-03-08 09:00');
      // The night is an hour shorter.
      expect(next.getTime() - after.getTime()).toBe(20 * HOUR_MS);
    });

    it('runs a time that the spring change skips when the clocks moved on', () => {
      const next = computeNextRunAt(daily('02:30'), local(2026, 3, 7, 12));
      expect(wallClock(next)).toBe('2026-03-08 03:30');
    });

    it('keeps the wall-clock time across the autumn DST change', () => {
      const after = local(2026, 10, 31, 12);
      const next = computeNextRunAt(daily('09:00'), after);

      expect(wallClock(next)).toBe('2026-11-01 09:00');
      // The night is an hour longer.
      expect(next.getTime() - after.getTime()).toBe(22 * HOUR_MS);
    });

    it('runs a repeated autumn time once', () => {
      const first = computeNextRunAt(daily('01:30'), local(2026, 11, 1, 0));
      const second = computeNextRunAt(daily('01:30'), first);

      expect(wallClock(first)).toBe('2026-11-01 01:30');
      expect(wallClock(second)).toBe('2026-11-02 01:30');
    });
  });

  describe('weekly', () => {
    // 2026-10-21 is a Wednesday.
    it('runs today when today is a chosen day and the time has not come', () => {
      const next = computeNextRunAt(
        weekly('18:00', [3]),
        local(2026, 10, 21, 9)
      );
      expect(wallClock(next)).toBe('2026-10-21 18:00');
    });

    it('runs on the next chosen day', () => {
      const next = computeNextRunAt(
        weekly('09:00', [1, 5]),
        local(2026, 10, 21, 9)
      );
      expect(wallClock(next)).toBe('2026-10-23 09:00');
      expect(next.getDay()).toBe(5);
    });

    it('wraps to the next week', () => {
      // Saturday evening -> Monday.
      const next = computeNextRunAt(
        weekly('09:00', [1, 3]),
        local(2026, 10, 24, 20)
      );
      expect(wallClock(next)).toBe('2026-10-26 09:00');
    });

    it('runs a week later when the only day is today and its time has passed', () => {
      const next = computeNextRunAt(
        weekly('09:00', [3]),
        local(2026, 10, 21, 9, 1)
      );
      expect(wallClock(next)).toBe('2026-10-28 09:00');
    });

    it('runs on Sunday, day 0, across the autumn DST change', () => {
      const next = computeNextRunAt(
        weekly('09:00', [0]),
        local(2026, 10, 28, 9)
      );
      expect(wallClock(next)).toBe('2026-11-01 09:00');
    });

    it('fails for a weekly preset without weekdays', () => {
      expect(() =>
        computeNextRunAt(weekly('09:00', []), local(2026, 10, 21))
      ).toThrow('no weekdays');
    });
  });

  describe('everyHours', () => {
    it('runs N hours after `after` by default', () => {
      const after = local(2026, 10, 21, 23, 15);
      const next = computeNextRunAt(everyHours(2), after);
      expect(next.getTime() - after.getTime()).toBe(2 * HOUR_MS);
      expect(wallClock(next)).toBe('2026-10-22 01:15');
    });

    it('keeps the rhythm of its anchor and skips missed runs', () => {
      const anchor = local(2026, 10, 21, 8);
      // The backend was down from 9:00 to 15:30.
      const next = computeNextRunAt(
        everyHours(3),
        local(2026, 10, 21, 15, 30),
        anchor
      );
      expect(wallClock(next)).toBe('2026-10-21 17:00');
    });

    it('runs the step after an anchor that is exactly now', () => {
      const anchor = local(2026, 10, 21, 8);
      expect(wallClock(computeNextRunAt(everyHours(4), anchor, anchor))).toBe(
        '2026-10-21 12:00'
      );
    });

    it('runs the first step after an anchor in the future', () => {
      const anchor = local(2026, 10, 21, 8);
      expect(
        wallClock(
          computeNextRunAt(everyHours(4), local(2026, 10, 21, 7), anchor)
        )
      ).toBe('2026-10-21 12:00');
    });

    it('counts elapsed hours, not wall-clock hours, across DST', () => {
      const after = local(2026, 11, 1, 0, 30);
      const next = computeNextRunAt(everyHours(2), after);
      expect(next.getTime() - after.getTime()).toBe(2 * HOUR_MS);
      // 00:30 EDT + 2 h is 01:30 EST.
      expect(wallClock(next)).toBe('2026-11-01 01:30');
    });

    it('runs once a day for 24 hours', () => {
      const after = local(2026, 10, 21, 9);
      expect(computeNextRunAt(everyHours(24), after).getTime()).toBe(
        after.getTime() + 24 * HOUR_MS
      );
    });
  });
});

describe('validateSchedulePreset', () => {
  it('accepts a daily preset and drops the other fields', () => {
    expect(
      validateSchedulePreset({
        kind: 'daily',
        time: '07:05',
        weekdays: [1],
        everyHours: 3
      })
    ).toEqual({ ok: true, preset: daily('07:05') });
  });

  it('accepts a weekly preset with sorted, unique weekdays', () => {
    expect(
      validateSchedulePreset({
        kind: 'weekly',
        time: '23:59',
        weekdays: [5, 0, 5]
      })
    ).toEqual({ ok: true, preset: weekly('23:59', [0, 5]) });
  });

  it('accepts every 1 to 24 hours', () => {
    expect(
      validateSchedulePreset({ kind: 'everyHours', everyHours: 1 })
    ).toEqual({ ok: true, preset: everyHours(1) });
    expect(
      validateSchedulePreset({ kind: 'everyHours', everyHours: 24 })
    ).toEqual({ ok: true, preset: everyHours(24) });
  });

  it.each([
    [{ kind: 'monthly', time: '09:00' }, 'kind must be one of'],
    [{ kind: 'daily' }, 'time must be HH:MM'],
    [{ kind: 'daily', time: '9:00' }, 'time must be HH:MM'],
    [{ kind: 'daily', time: '24:00' }, 'time must be HH:MM'],
    [{ kind: 'daily', time: '12:60' }, 'time must be HH:MM'],
    [{ kind: 'weekly', time: '09:00' }, 'weekdays must list'],
    [{ kind: 'weekly', time: '09:00', weekdays: [] }, 'weekdays must list'],
    [{ kind: 'weekly', time: '09:00', weekdays: [7] }, 'weekdays must list'],
    [{ kind: 'weekly', time: '09:00', weekdays: [1.5] }, 'weekdays must list'],
    [{ kind: 'weekly', time: '09:00', weekdays: ['1'] }, 'weekdays must list'],
    [{ kind: 'everyHours' }, 'everyHours must be'],
    [{ kind: 'everyHours', everyHours: 0 }, 'everyHours must be'],
    [{ kind: 'everyHours', everyHours: 25 }, 'everyHours must be'],
    [{ kind: 'everyHours', everyHours: 1.5 }, 'everyHours must be'],
    [{ kind: 'everyHours', everyHours: '2' }, 'everyHours must be']
  ])('rejects %j', (input, error) => {
    const result = validateSchedulePreset(input);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain(error);
  });
});
