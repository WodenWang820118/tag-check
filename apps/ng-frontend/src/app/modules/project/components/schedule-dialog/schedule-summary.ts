import type { SchedulePreset } from '@utils';

/** The days of the week, Monday first; `day` is the API's (Sunday = 0). */
export const WEEKDAYS: readonly {
  day: number;
  label: string;
  testId: string;
}[] = [
  { day: 1, label: 'Mon', testId: 'mon' },
  { day: 2, label: 'Tue', testId: 'tue' },
  { day: 3, label: 'Wed', testId: 'wed' },
  { day: 4, label: 'Thu', testId: 'thu' },
  { day: 5, label: 'Fri', testId: 'fri' },
  { day: 6, label: 'Sat', testId: 'sat' },
  { day: 0, label: 'Sun', testId: 'sun' }
];

/**
 * A preset in a few words: "Daily at 09:00", "Mon, Wed at 18:30" or
 * "Every 6 hours".
 */
export function scheduleSummary(preset: SchedulePreset): string {
  switch (preset.kind) {
    case 'daily':
      return `Daily at ${preset.time ?? ''}`;
    case 'weekly': {
      const days = WEEKDAYS.filter(({ day }) =>
        (preset.weekdays ?? []).includes(day)
      ).map(({ label }) => label);
      return `${days.join(', ')} at ${preset.time ?? ''}`;
    }
    case 'everyHours':
      return preset.everyHours === 1
        ? 'Every hour'
        : `Every ${preset.everyHours ?? ''} hours`;
  }
}
