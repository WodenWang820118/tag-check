/**
 * A schedule's preset: every day at `time`, on chosen `weekdays` at `time`,
 * or every `everyHours` hours.
 */
export type ScheduleKind = 'daily' | 'weekly' | 'everyHours';

/** The fields of a preset, as stored: only the kind's own fields are set. */
export type SchedulePreset = {
  kind: ScheduleKind;
  /** `HH:MM`, 24-hour, in the backend machine's local time; daily and weekly only. */
  time: string | null;
  /** Days of the week, Sunday = 0 to Saturday = 6, ascending; weekly only. */
  weekdays: number[] | null;
  /** 1 to 24; everyHours only. */
  everyHours: number | null;
};

/**
 * Body of POST /schedules/:projectSlug, and of PUT
 * /schedules/:projectSlug/:scheduleId, where every field is optional and the
 * missing ones keep their value. A field the preset does not use is ignored.
 */
export type ScheduleRequest = {
  name: string;
  /** The tests to run, in order; tests deleted later are skipped. */
  eventIds: string[];
  kind: ScheduleKind;
  time?: string | null;
  weekdays?: number[] | null;
  everyHours?: number | null;
  /** Defaults to true. */
  enabled?: boolean;
};

/**
 * A schedule as the schedules endpoints return it. Its runs are batches with
 * `source: 'schedule'`, always headless.
 */
export type ScheduleResponse = {
  id: number;
  projectSlug: string;
  name: string;
  eventIds: string[];
  enabled: boolean;
  /** When the schedule last started a batch; null before its first run. */
  lastRunAt: Date | null;
  /** When it runs next; null while it is disabled. */
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} & SchedulePreset;
