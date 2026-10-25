import {
  BadRequestException,
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationBootstrap
} from '@nestjs/common';
import {
  computeNextRunAt,
  SCHEDULE_NAME_MAX_LENGTH,
  validateSchedulePreset,
  type BatchRunResponse,
  type SchedulePreset,
  type ScheduleResponse
} from '@utils';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import {
  ScheduleFields,
  ScheduleRepositoryService
} from '../../core/repository/schedule/schedule-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import type { ScheduleEntity } from '../../shared';
import { BatchQueueService, MAX_BATCH_TESTS } from './batch-queue.service';
import { toScheduleResponse } from './batch-run.mapper';

/**
 * How late a due run may still start. A timer fires a little late on a busy
 * event loop; a run later than this was missed (the machine slept) and is
 * skipped.
 */
export const MISSED_RUN_GRACE_MS = 2 * 60 * 1000;

/**
 * The longest the timer waits before it looks at the schedules again, so a
 * changed clock or a long sleep cannot leave it waiting for days.
 */
export const MAX_TIMER_DELAY_MS = 60 * 60 * 1000;

function presetOf(schedule: SchedulePreset): SchedulePreset {
  return {
    kind: schedule.kind,
    time: schedule.time,
    weekdays: schedule.weekdays,
    everyHours: schedule.everyHours
  };
}

function samePreset(a: SchedulePreset, b: SchedulePreset): boolean {
  return JSON.stringify(presetOf(a)) === JSON.stringify(presetOf(b));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Keeps each project's schedules and starts their runs: each run is a
 * headless batch (`source: 'schedule'`) in the BatchQueueService.
 *
 * One timer waits for the earliest enabled schedule; it is re-armed on every
 * change and after it fires. Times are the backend machine's local time.
 * Runs missed while the backend was down, or the machine slept, are skipped
 * with one log line; the schedule moves on to its next future run.
 */
@Injectable()
export class ScheduleService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(ScheduleService.name);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private ticking: Promise<void> | null = null;

  constructor(
    private readonly schedules: ScheduleRepositoryService,
    private readonly projects: ProjectRepositoryService,
    private readonly testEvents: TestEventRepositoryService,
    private readonly batchQueue: BatchQueueService
  ) {}

  /** Skips the runs missed while the backend was down, then arms the timer. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.skipMissedRuns(new Date());
      await this.arm();
    } catch (error) {
      this.logger.error(`Could not start the schedules: ${error}`);
    }
  }

  beforeApplicationShutdown(): void {
    this.stopped = true;
    this.clearTimer();
  }

  /** @throws HttpException 404 for an unknown project. */
  async list(projectSlug: string): Promise<ScheduleResponse[]> {
    await this.projects.getEntityBySlug(projectSlug);
    const schedules = await this.schedules.listForProject(projectSlug);
    return schedules.map(toScheduleResponse);
  }

  /**
   * @throws BadRequestException for an invalid body.
   * @throws HttpException 404 for an unknown project.
   */
  async create(projectSlug: string, body: unknown): Promise<ScheduleResponse> {
    const project = await this.projects.getEntityBySlug(projectSlug);
    const input = await this.readBody(projectSlug, body, null);
    const now = new Date();
    const schedule = await this.schedules.create(project, {
      ...input,
      lastRunAt: null,
      nextRunAt: input.enabled ? computeNextRunAt(input, now) : null
    });
    this.logger.log(
      `Created schedule ${schedule.id} of ${projectSlug}: ${schedule.kind}, next run ${schedule.nextRunAt?.toISOString() ?? 'none'}`
    );
    await this.arm();
    return toScheduleResponse(schedule);
  }

  /**
   * Changes the fields the body has; the others keep their value. The next
   * run is computed again when the preset changes or the schedule is
   * enabled.
   *
   * @throws BadRequestException for an invalid body.
   * @throws HttpException 404 when the project has no such schedule.
   */
  async update(
    projectSlug: string,
    scheduleId: number,
    body: unknown
  ): Promise<ScheduleResponse> {
    const existing = await this.schedules.getForProject(
      projectSlug,
      scheduleId
    );
    const input = await this.readBody(projectSlug, body, existing);
    let nextRunAt = existing.nextRunAt;
    if (!input.enabled) {
      nextRunAt = null;
    } else if (
      !existing.enabled ||
      !samePreset(existing, input) ||
      nextRunAt === null
    ) {
      nextRunAt = computeNextRunAt(input, new Date());
    }
    const schedule = await this.schedules.update(scheduleId, {
      ...input,
      nextRunAt
    });
    await this.arm();
    return toScheduleResponse(schedule);
  }

  /** @throws HttpException 404 when the project has no such schedule. */
  async delete(projectSlug: string, scheduleId: number): Promise<void> {
    await this.schedules.getForProject(projectSlug, scheduleId);
    await this.schedules.delete(scheduleId);
    await this.arm();
  }

  /**
   * Starts a run of the schedule now, enabled or not. Its next run stays
   * as it was.
   *
   * @throws BadRequestException when none of its tests exist any more.
   * @throws HttpException 404 when the project has no such schedule.
   */
  async runNow(
    projectSlug: string,
    scheduleId: number
  ): Promise<BatchRunResponse> {
    const schedule = await this.schedules.getForProject(
      projectSlug,
      scheduleId
    );
    const batch = await this.startRun(schedule);
    await this.schedules.update(schedule.id, { lastRunAt: new Date() });
    return batch;
  }

  /**
   * Starts the runs that are due at `now` and moves each fired or missed
   * schedule to its next run, then re-arms the timer. Ticks never overlap.
   */
  async tick(now: Date = new Date()): Promise<void> {
    if (this.ticking) {
      await this.ticking;
      return;
    }
    this.ticking = this.fireDue(now).finally(() => {
      this.ticking = null;
    });
    await this.ticking;
    await this.arm();
  }

  private async fireDue(now: Date): Promise<void> {
    for (const schedule of await this.schedules.listEnabled()) {
      const due = schedule.nextRunAt;
      if (due === null) {
        await this.schedules.update(schedule.id, {
          nextRunAt: computeNextRunAt(schedule, now)
        });
        continue;
      }
      if (due.getTime() > now.getTime()) continue;

      const next = computeNextRunAt(schedule, now, due);
      if (now.getTime() - due.getTime() > MISSED_RUN_GRACE_MS) {
        this.logMissed(schedule, due, next);
        await this.schedules.update(schedule.id, { nextRunAt: next });
        continue;
      }
      try {
        await this.startRun(schedule);
      } catch (error) {
        this.logger.warn(
          `Schedule ${schedule.id} (${schedule.name}) did not start its run: ${error}`
        );
      }
      await this.schedules.update(schedule.id, {
        lastRunAt: now,
        nextRunAt: next
      });
    }
  }

  /** Moves every schedule whose run is past to its next future run. */
  async skipMissedRuns(now: Date): Promise<void> {
    for (const schedule of await this.schedules.listEnabled()) {
      const due = schedule.nextRunAt;
      if (due !== null && due.getTime() > now.getTime()) continue;
      const next = computeNextRunAt(schedule, now, due ?? now);
      if (due !== null) {
        this.logMissed(schedule, due, next);
      }
      await this.schedules.update(schedule.id, { nextRunAt: next });
    }
  }

  private logMissed(schedule: ScheduleEntity, due: Date, next: Date): void {
    this.logger.log(
      `Schedule ${schedule.id} (${schedule.name}) missed its run at ${due.toISOString()}; next run at ${next.toISOString()}`
    );
  }

  private async startRun(schedule: ScheduleEntity): Promise<BatchRunResponse> {
    return await this.batchQueue.enqueue(
      schedule.project.projectSlug,
      schedule.eventIds,
      {
        source: 'schedule',
        headless: true,
        scheduleId: schedule.id,
        skipMissingTests: true
      }
    );
  }

  /** Waits for the earliest enabled schedule, at most MAX_TIMER_DELAY_MS. */
  private async arm(): Promise<void> {
    this.clearTimer();
    if (this.stopped) return;
    const times = (await this.schedules.listEnabled()).flatMap((schedule) =>
      schedule.nextRunAt ? [schedule.nextRunAt.getTime()] : []
    );
    if (times.length === 0 || this.stopped) return;
    // Another arm may have run while the schedules were read.
    this.clearTimer();
    const delay = Math.min(
      Math.max(Math.min(...times) - Date.now(), 0),
      MAX_TIMER_DELAY_MS
    );
    this.timer = setTimeout(() => {
      this.timer = null;
      this.tick().catch((error) => {
        this.logger.error(`Schedule timer failed: ${error}`);
      });
    }, delay);
    // The timer alone does not keep the process (or a test run) alive.
    this.timer.unref?.();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Reads and checks a create or update body. For an update, a missing field
   * keeps the schedule's value.
   */
  private async readBody(
    projectSlug: string,
    body: unknown,
    existing: ScheduleEntity | null
  ): Promise<
    SchedulePreset & Pick<ScheduleFields, 'name' | 'eventIds' | 'enabled'>
  > {
    if (!isRecord(body)) {
      throw new BadRequestException('The body must be a JSON object');
    }

    const name = body['name'] ?? existing?.name;
    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      name.trim().length > SCHEDULE_NAME_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `name must be a non-empty string of at most ${SCHEDULE_NAME_MAX_LENGTH} characters`
      );
    }

    const eventIds = body['eventIds'] ?? existing?.eventIds;
    if (
      !Array.isArray(eventIds) ||
      eventIds.length === 0 ||
      eventIds.length > MAX_BATCH_TESTS ||
      !eventIds.every((id) => typeof id === 'string' && id !== '')
    ) {
      throw new BadRequestException(
        `eventIds must list 1 to ${MAX_BATCH_TESTS} test eventIds`
      );
    }
    const ids: string[] = eventIds.filter(
      (id): id is string => typeof id === 'string'
    );
    if (body['eventIds'] !== undefined) {
      await this.assertTestsExist(projectSlug, ids);
    }

    const enabled = body['enabled'] ?? existing?.enabled ?? true;
    if (typeof enabled !== 'boolean') {
      throw new BadRequestException('enabled must be true or false');
    }

    const validation = validateSchedulePreset({
      kind: body['kind'] ?? existing?.kind,
      time: body['time'] ?? existing?.time,
      weekdays: body['weekdays'] ?? existing?.weekdays,
      everyHours: body['everyHours'] ?? existing?.everyHours
    });
    if (!validation.ok) {
      throw new BadRequestException(validation.error);
    }
    return { ...validation.preset, name: name.trim(), eventIds: ids, enabled };
  }

  private async assertTestsExist(
    projectSlug: string,
    eventIds: string[]
  ): Promise<void> {
    const found = await this.testEvents.listEntitiesBySlugAndEventIds(
      projectSlug,
      [...new Set(eventIds)]
    );
    const known = new Set(found.map((test) => test.eventId));
    const missing = eventIds.filter((id) => !known.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `The project has no tests with these eventIds: ${missing.join(', ')}`
      );
    }
  }
}
