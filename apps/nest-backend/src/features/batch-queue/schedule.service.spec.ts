import { BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchRunEntity, ScheduleEntity, TestEventEntity } from '../../shared';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ScheduleRepositoryService } from '../../core/repository/schedule/schedule-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import {
  BatchQueueTestbed,
  createBatchQueueTestbed,
  seedProject
} from './batch-queue.spec-helpers';
import {
  MAX_TIMER_DELAY_MS,
  MISSED_RUN_GRACE_MS,
  ScheduleService
} from './schedule.service';

const HOUR_MS = 60 * 60 * 1000;
const T0 = new Date('2026-10-21T08:00:00.000Z');

describe('ScheduleService (SQLite)', () => {
  let bed: BatchQueueTestbed;
  let schedules: ScheduleService;

  beforeEach(async () => {
    bed = await createBatchQueueTestbed();
    schedules = bed.scheduleService;
    await seedProject(bed.dataSource, 'shop', ['a', 'b']);
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(T0);
  });

  afterEach(async () => {
    schedules.beforeApplicationShutdown();
    vi.useRealTimers();
    await bed.batchQueue.whenIdle();
    await bed.moduleRef.close();
  });

  async function batches() {
    return await bed.dataSource.manager.find(BatchRunEntity, {
      order: { id: 'ASC' }
    });
  }

  function everyHours(hours: number, extra: Record<string, unknown> = {}) {
    return {
      name: 'Hourly',
      eventIds: ['a', 'b'],
      kind: 'everyHours',
      everyHours: hours,
      ...extra
    };
  }

  describe('create', () => {
    it('saves the preset and computes the next run', async () => {
      const created = await schedules.create('shop', {
        name: '  Nightly  ',
        eventIds: ['b', 'a'],
        kind: 'weekly',
        time: '02:30',
        weekdays: [5, 1],
        everyHours: 7
      });

      expect(created).toMatchObject({
        projectSlug: 'shop',
        name: 'Nightly',
        eventIds: ['b', 'a'],
        kind: 'weekly',
        time: '02:30',
        weekdays: [1, 5],
        everyHours: null,
        enabled: true,
        lastRunAt: null
      });
      expect(created.nextRunAt?.getTime()).toBeGreaterThan(T0.getTime());
      // Monday or Friday at 02:30, local time.
      expect([1, 5]).toContain(created.nextRunAt?.getDay());
      expect(created.nextRunAt?.getHours()).toBe(2);
      expect(created.nextRunAt?.getMinutes()).toBe(30);
    });

    it('runs an everyHours schedule N hours after it is created', async () => {
      const created = await schedules.create('shop', everyHours(3));
      expect(created.nextRunAt).toEqual(new Date(T0.getTime() + 3 * HOUR_MS));
    });

    it('has no next run while disabled', async () => {
      const created = await schedules.create(
        'shop',
        everyHours(1, { enabled: false })
      );
      expect(created.enabled).toBe(false);
      expect(created.nextRunAt).toBeNull();
    });

    it.each([
      [null, 'The body must be a JSON object'],
      [{ ...everyHours(1), name: ' ' }, 'name must be a non-empty string'],
      [{ ...everyHours(1), eventIds: [] }, 'eventIds must list'],
      [{ ...everyHours(1), eventIds: [3] }, 'eventIds must list'],
      [
        { ...everyHours(1), eventIds: ['zzz'] },
        'no tests with these eventIds: zzz'
      ],
      [{ ...everyHours(1), enabled: 'yes' }, 'enabled must be true or false'],
      [everyHours(0), 'everyHours must be a whole number from 1 to 24'],
      [everyHours(25), 'everyHours must be a whole number from 1 to 24'],
      [{ ...everyHours(1), kind: 'daily', time: '7:00' }, 'time must be HH:MM'],
      [
        { ...everyHours(1), kind: 'weekly', time: '07:00', weekdays: [] },
        'weekdays must list at least one day'
      ],
      [{ ...everyHours(1), kind: 'monthly' }, 'kind must be one of']
    ])('rejects %j', async (body, message) => {
      const result = schedules.create('shop', body);
      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow(message);
    });

    it('answers 404 for an unknown project', async () => {
      await expect(schedules.create('nope', everyHours(1))).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('firing', () => {
    it('starts a headless schedule batch when due and moves to the next run', async () => {
      const created = await schedules.create('shop', everyHours(1));
      const due = new Date(T0.getTime() + HOUR_MS + 10_000);
      vi.setSystemTime(due);

      await schedules.tick(due);
      await bed.batchQueue.whenIdle();

      const [batch] = await batches();
      expect(batch).toMatchObject({
        source: 'schedule',
        scheduleId: created.id,
        headless: true,
        status: 'completed'
      });
      expect(bed.fakeRun.calls).toEqual([
        { projectSlug: 'shop', eventId: 'a', headless: true },
        { projectSlug: 'shop', eventId: 'b', headless: true }
      ]);
      const [after] = await schedules.list('shop');
      expect(after?.lastRunAt).toEqual(due);
      // The rhythm follows the schedule, not the late tick.
      expect(after?.nextRunAt).toEqual(new Date(T0.getTime() + 2 * HOUR_MS));
    });

    it('fires from its timer', async () => {
      await schedules.create('shop', everyHours(1));
      expect(vi.getTimerCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(HOUR_MS);
      await vi.waitFor(async () => expect(await batches()).toHaveLength(1));
      await bed.batchQueue.whenIdle();

      // Re-armed for the next run.
      await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
      const [after] = await schedules.list('shop');
      expect(after?.nextRunAt).toEqual(new Date(T0.getTime() + 2 * HOUR_MS));
    });

    it('wakes at least hourly for a run days away', async () => {
      await schedules.create('shop', {
        name: 'Weekly',
        eventIds: ['a'],
        kind: 'weekly',
        time: '09:00',
        weekdays: [new Date(T0.getTime() - 24 * HOUR_MS).getDay()]
      });
      const tick = vi.spyOn(schedules, 'tick');

      await vi.advanceTimersByTimeAsync(MAX_TIMER_DELAY_MS);

      expect(tick).toHaveBeenCalledTimes(1);
      expect(await batches()).toHaveLength(0);
    });

    it('never fires a disabled schedule', async () => {
      await schedules.create('shop', everyHours(1, { enabled: false }));
      expect(vi.getTimerCount()).toBe(0);

      const later = new Date(T0.getTime() + 5 * HOUR_MS);
      vi.setSystemTime(later);
      await schedules.tick(later);

      expect(await batches()).toHaveLength(0);
    });

    it('skips a run missed by more than the grace period, without catching up', async () => {
      await schedules.create('shop', everyHours(2));
      const late = new Date(
        T0.getTime() + 2 * HOUR_MS + MISSED_RUN_GRACE_MS + 1000
      );
      vi.setSystemTime(late);

      await schedules.tick(late);

      expect(await batches()).toHaveLength(0);
      const [after] = await schedules.list('shop');
      expect(after?.lastRunAt).toBeNull();
      expect(after?.nextRunAt).toEqual(new Date(T0.getTime() + 4 * HOUR_MS));
    });

    it('skips the runs missed while the backend was down when it starts', async () => {
      const created = await schedules.create('shop', everyHours(1));
      // The backend was down from 08:30 until 11:20, a minute after a due run.
      schedules.beforeApplicationShutdown();
      const restart = new Date(T0.getTime() + 3 * HOUR_MS + 20 * 60 * 1000);
      vi.setSystemTime(restart);
      const restarted = new ScheduleService(
        bed.moduleRef.get(ScheduleRepositoryService),
        bed.moduleRef.get(ProjectRepositoryService),
        bed.moduleRef.get(TestEventRepositoryService),
        bed.batchQueue
      );

      await restarted.onApplicationBootstrap();
      restarted.beforeApplicationShutdown();

      expect(await batches()).toHaveLength(0);
      const after = await bed.dataSource.manager.findOneByOrFail(
        ScheduleEntity,
        { id: created.id }
      );
      expect(after.nextRunAt).toEqual(new Date(T0.getTime() + 4 * HOUR_MS));
      expect(after.lastRunAt).toBeNull();
    });

    it('skips tests deleted since the schedule was made', async () => {
      await schedules.create('shop', everyHours(1));
      await bed.dataSource.manager.delete(TestEventEntity, { eventId: 'a' });
      const due = new Date(T0.getTime() + HOUR_MS);
      vi.setSystemTime(due);

      await schedules.tick(due);
      await bed.batchQueue.whenIdle();

      expect(bed.fakeRun.calls.map((call) => call.eventId)).toEqual(['b']);
    });

    it('moves on when none of its tests exist any more', async () => {
      await schedules.create('shop', everyHours(1));
      await bed.dataSource.manager.delete(TestEventEntity, {
        eventId: In(['a', 'b'])
      });
      const due = new Date(T0.getTime() + HOUR_MS);
      vi.setSystemTime(due);

      await schedules.tick(due);

      expect(await batches()).toHaveLength(0);
      const [after] = await schedules.list('shop');
      expect(after?.nextRunAt).toEqual(new Date(T0.getTime() + 2 * HOUR_MS));
    });
  });

  describe('update, delete and run now', () => {
    it('keeps the next run when only the name changes', async () => {
      const created = await schedules.create('shop', everyHours(3));
      vi.setSystemTime(new Date(T0.getTime() + HOUR_MS));

      const renamed = await schedules.update('shop', created.id, {
        name: 'Renamed'
      });

      expect(renamed.name).toBe('Renamed');
      expect(renamed.kind).toBe('everyHours');
      expect(renamed.nextRunAt).toEqual(created.nextRunAt);
    });

    it('computes the next run again for a new preset, and on enable', async () => {
      const created = await schedules.create('shop', everyHours(3));
      const now = new Date(T0.getTime() + HOUR_MS);
      vi.setSystemTime(now);

      const changed = await schedules.update('shop', created.id, {
        everyHours: 1
      });
      expect(changed.nextRunAt).toEqual(new Date(now.getTime() + HOUR_MS));

      const disabled = await schedules.update('shop', created.id, {
        enabled: false
      });
      expect(disabled.nextRunAt).toBeNull();

      const enabled = await schedules.update('shop', created.id, {
        enabled: true
      });
      expect(enabled.nextRunAt).toEqual(new Date(now.getTime() + HOUR_MS));
    });

    it('validates the merged preset', async () => {
      const created = await schedules.create('shop', everyHours(3));

      await expect(
        schedules.update('shop', created.id, { kind: 'daily' })
      ).rejects.toThrow('time must be HH:MM');

      const daily = await schedules.update('shop', created.id, {
        kind: 'daily',
        time: '06:15'
      });
      expect(daily).toMatchObject({
        kind: 'daily',
        time: '06:15',
        weekdays: null,
        everyHours: null
      });
    });

    it("answers 404 for another project's schedule", async () => {
      await seedProject(bed.dataSource, 'other', ['x']);
      const created = await schedules.create('shop', everyHours(1));

      await expect(
        schedules.update('other', created.id, { name: 'x' })
      ).rejects.toThrow('Schedule not found');
      await expect(schedules.delete('other', created.id)).rejects.toThrow(
        'Schedule not found'
      );
    });

    it('runs a disabled schedule now and keeps its next run', async () => {
      const created = await schedules.create(
        'shop',
        everyHours(1, { enabled: false })
      );

      const batch = await schedules.runNow('shop', created.id);
      await bed.batchQueue.whenIdle();

      expect(batch).toMatchObject({
        source: 'schedule',
        scheduleId: created.id,
        headless: true
      });
      const [after] = await schedules.list('shop');
      expect(after?.lastRunAt).toEqual(T0);
      expect(after?.nextRunAt).toBeNull();
    });

    it('deletes a schedule and keeps its batches', async () => {
      const created = await schedules.create('shop', everyHours(1));
      const batch = await schedules.runNow('shop', created.id);
      await bed.batchQueue.whenIdle();

      await schedules.delete('shop', created.id);

      await expect(schedules.list('shop')).resolves.toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
      await expect(bed.batchQueue.get('shop', batch.id)).resolves.toMatchObject(
        { source: 'schedule', scheduleId: null }
      );
    });
  });
});
