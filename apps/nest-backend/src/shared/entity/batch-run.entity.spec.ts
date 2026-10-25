import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_ENTITIES } from '../../core/database/database-entities';
import {
  createMigratedDataSource,
  DATABASE_MIGRATIONS
} from '../../core/database/database-migrations';
import { BatchRunEntity } from './batch-run.entity';
import { BatchRunItemEntity } from './batch-run-item.entity';
import { ProjectEntity } from './project.entity';
import { ScheduleEntity } from './schedule.entity';
import { TestEventDetailEntity } from './test-event-detail.entity';
import { TestEventEntity } from './test-event.entity';

/** The batch and schedule entities on a migrated SQLite database. */
describe('batch run and schedule entities (SQLite, migrated)', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createMigratedDataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: DATABASE_ENTITIES,
      migrations: DATABASE_MIGRATIONS
    });
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  async function seed() {
    const manager = dataSource.manager;
    const project = await manager.save(ProjectEntity, {
      projectSlug: 'shop',
      projectName: 'Shop'
    });
    const testEvent = await manager.save(TestEventEntity, {
      project,
      eventId: 'evt-1',
      eventName: 'add_to_cart',
      testName: 'Add to cart',
      message: ''
    });
    const detail = await manager.save(TestEventDetailEntity, {
      testEvent,
      passed: true,
      requestPassed: false,
      destinationUrl: 'https://shop.example/'
    });
    const schedule = await manager.save(ScheduleEntity, {
      project,
      name: 'Nightly',
      eventIds: ['evt-1', 'evt-2'],
      kind: 'weekly',
      time: '02:30',
      weekdays: [1, 3],
      everyHours: null,
      enabled: true,
      lastRunAt: null,
      nextRunAt: new Date('2026-10-26T18:30:00.000Z')
    });
    const batch = await manager.save(BatchRunEntity, {
      project,
      source: 'schedule',
      scheduleId: schedule.id,
      headless: true,
      status: 'completed',
      startedAt: new Date('2026-10-25T01:02:03.456Z'),
      finishedAt: null
    });
    const item = await manager.save(BatchRunItemEntity, {
      batchRun: batch,
      testEvent,
      position: 0,
      status: 'partial',
      message: null,
      startedAt: null,
      finishedAt: null,
      testEventDetailId: detail.id
    });
    return { project, testEvent, detail, schedule, batch, item };
  }

  it('keeps JSON arrays, booleans and instants', async () => {
    const { schedule, batch } = await seed();

    const savedSchedule = await dataSource.manager.findOneByOrFail(
      ScheduleEntity,
      { id: schedule.id }
    );
    expect(savedSchedule).toMatchObject({
      eventIds: ['evt-1', 'evt-2'],
      weekdays: [1, 3],
      everyHours: null,
      enabled: true,
      lastRunAt: null
    });
    expect(savedSchedule.nextRunAt?.toISOString()).toBe(
      '2026-10-26T18:30:00.000Z'
    );

    const savedBatch = await dataSource.manager.findOneByOrFail(
      BatchRunEntity,
      { id: batch.id }
    );
    expect(savedBatch.headless).toBe(true);
    expect(savedBatch.startedAt?.toISOString()).toBe(
      '2026-10-25T01:02:03.456Z'
    );
    // Stored as UTC text, whatever the machine's time zone.
    expect(
      await dataSource.query('SELECT "started_at" FROM "batch_run"')
    ).toEqual([{ started_at: '2026-10-25 01:02:03.456' }]);
  });

  it('keeps an item without its result when the run is deleted', async () => {
    const { detail, item } = await seed();

    await dataSource.manager.delete(TestEventDetailEntity, { id: detail.id });

    await expect(
      dataSource.manager.findOneByOrFail(BatchRunItemEntity, { id: item.id })
    ).resolves.toMatchObject({ status: 'partial', testEventDetailId: null });
  });

  it('deletes the items of a deleted test', async () => {
    const { testEvent, batch } = await seed();

    await dataSource.manager.delete(TestEventEntity, { id: testEvent.id });

    await expect(dataSource.manager.count(BatchRunItemEntity)).resolves.toBe(0);
    await expect(
      dataSource.manager.countBy(BatchRunEntity, { id: batch.id })
    ).resolves.toBe(1);
  });

  it('keeps the batches of a deleted schedule', async () => {
    const { schedule, batch } = await seed();

    await dataSource.manager.delete(ScheduleEntity, { id: schedule.id });

    await expect(
      dataSource.manager.findOneByOrFail(BatchRunEntity, { id: batch.id })
    ).resolves.toMatchObject({ source: 'schedule', scheduleId: null });
  });

  it('deletes batches, items and schedules with their project', async () => {
    const { project } = await seed();

    await dataSource.manager.delete(ProjectEntity, { id: project.id });

    await expect(dataSource.manager.count(ScheduleEntity)).resolves.toBe(0);
    await expect(dataSource.manager.count(BatchRunEntity)).resolves.toBe(0);
    await expect(dataSource.manager.count(BatchRunItemEntity)).resolves.toBe(0);
  });
});
