import type {
  ScheduleKind,
  SchedulePreset
} from '../types/tag-check/schedule.type';

const SCHEDULE_KINDS: readonly ScheduleKind[] = [
  'daily',
  'weekly',
  'everyHours'
];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HOUR_MS = 60 * 60 * 1000;

/** The longest schedule name the API accepts. */
export const SCHEDULE_NAME_MAX_LENGTH = 255;

/** A preset that passed validation, or the reason it did not. */
export type SchedulePresetValidation =
  | { ok: true; preset: SchedulePreset }
  | { ok: false; error: string };

function isScheduleKind(value: unknown): value is ScheduleKind {
  return SCHEDULE_KINDS.some((kind) => kind === value);
}

/**
 * Checks a preset's fields and keeps only those its kind uses: `time` as
 * `HH:MM` for daily and weekly, at least one weekday (0 to 6) for weekly,
 * and a whole number of hours from 1 to 24 for everyHours. Weekdays come
 * back sorted, without repeats.
 */
export function validateSchedulePreset(input: {
  kind?: unknown;
  time?: unknown;
  weekdays?: unknown;
  everyHours?: unknown;
}): SchedulePresetValidation {
  const { kind } = input;
  if (!isScheduleKind(kind)) {
    return {
      ok: false,
      error: `kind must be one of ${SCHEDULE_KINDS.join(', ')}`
    };
  }

  if (kind === 'everyHours') {
    const hours = input.everyHours;
    if (
      typeof hours !== 'number' ||
      !Number.isInteger(hours) ||
      hours < 1 ||
      hours > 24
    ) {
      return {
        ok: false,
        error: 'everyHours must be a whole number from 1 to 24'
      };
    }
    return {
      ok: true,
      preset: { kind, time: null, weekdays: null, everyHours: hours }
    };
  }

  if (typeof input.time !== 'string' || !TIME_PATTERN.test(input.time)) {
    return { ok: false, error: 'time must be HH:MM, from 00:00 to 23:59' };
  }
  if (kind === 'daily') {
    return {
      ok: true,
      preset: { kind, time: input.time, weekdays: null, everyHours: null }
    };
  }

  const weekdays = input.weekdays;
  if (
    !Array.isArray(weekdays) ||
    weekdays.length === 0 ||
    !weekdays.every(
      (day) =>
        typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6
    )
  ) {
    return {
      ok: false,
      error: 'weekdays must list at least one day, from 0 (Sunday) to 6'
    };
  }
  const days = [...new Set<number>(weekdays)].sort((a, b) => a - b);
  return {
    ok: true,
    preset: { kind, time: input.time, weekdays: days, everyHours: null }
  };
}

/** The local date `offset` days after `from`'s, at `time` (`HH:MM`). */
function atLocalTime(from: Date, offset: number, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  // Built from calendar fields, not by adding 24 h, so a day that is 23 or
  // 25 hours long (a DST change) keeps the wall-clock time.
  return new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() + offset,
    hours,
    minutes
  );
}

/**
 * The first time the preset runs strictly after `after`.
 *
 * Daily and weekly presets run at `time` in the local time zone of the
 * machine that computes it. A time that a DST change skips runs when the
 * clocks have moved on (02:30 becomes 03:30); a time that occurs twice runs
 * once, the first time.
 *
 * An everyHours preset runs every N hours of elapsed time counted from
 * `anchor` (by default `after`): the result is `anchor + k * N` hours for
 * the smallest k >= 1 that is after `after`. Passing the run that just fired
 * as the anchor keeps the schedule's rhythm across missed runs.
 */
export function computeNextRunAt(
  preset: SchedulePreset,
  after: Date,
  anchor: Date = after
): Date {
  if (preset.kind === 'everyHours') {
    const step = (preset.everyHours ?? 1) * HOUR_MS;
    const elapsed = after.getTime() - anchor.getTime();
    const steps = elapsed < 0 ? 1 : Math.floor(elapsed / step) + 1;
    return new Date(anchor.getTime() + steps * step);
  }

  const time = preset.time ?? '00:00';
  const weekdays = preset.kind === 'weekly' ? (preset.weekdays ?? []) : null;
  // Eight days reach the same weekday a week later, past today's time.
  for (let offset = 0; offset <= 8; offset++) {
    const candidate = atLocalTime(after, offset, time);
    if (
      candidate.getTime() > after.getTime() &&
      (weekdays === null || weekdays.includes(candidate.getDay()))
    ) {
      return candidate;
    }
  }
  throw new Error('The weekly preset has no weekdays');
}
