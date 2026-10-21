import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ItemDefEntity,
  ProjectEntity,
  RecordingEntity,
  SpecEntity,
  TestEventDetailEntity,
  TestEventEntity,
  TestImageEntity
} from '../../../shared';
import { TestEventDetailRepositoryService } from './test-event-detail-repository.service';

const entities = [
  ProjectEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  RecordingEntity,
  SpecEntity,
  TestEventEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity
];

describe('TestEventDetailRepositoryService.deleteRuns (SQLite)', () => {
  let module: TestingModule;
  let service: TestEventDetailRepositoryService;
  let dataSource: DataSource;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities,
          synchronize: true,
          dropSchema: true,
          logging: false
        }),
        TypeOrmModule.forFeature(entities)
      ],
      providers: [TestEventDetailRepositoryService]
    }).compile();
    service = module.get(TestEventDetailRepositoryService);
    dataSource = module.get(DataSource);
  });

  afterEach(async () => {
    await module?.close();
  });

  async function project(projectSlug: string) {
    return await dataSource.manager.save(ProjectEntity, {
      projectSlug,
      projectName: projectSlug
    });
  }

  async function test(projectEntity: ProjectEntity, eventId: string) {
    return await dataSource.manager.save(TestEventEntity, {
      project: projectEntity,
      eventId,
      eventName: eventId,
      testName: eventId,
      message: 'This is a standard test'
    });
  }

  /** Saves a run started at `time` (hh:mm) and its screenshot 20 s later. */
  async function run(
    testEvent: TestEventEntity,
    time: string,
    { linked = true, message = `run at ${time}` } = {}
  ) {
    const screenshot = await dataSource.manager.save(TestImageEntity, {
      testEvent,
      imageName: 'screenshot.png',
      imageData: Buffer.from(time),
      imageSize: time.length
    });
    // Runs saved before runs were linked to their screenshot have no link.
    const result = await service.create(
      testEvent,
      { passed: true, requestPassed: true, destinationUrl: '', message },
      linked ? screenshot : null
    );
    await dataSource.query(
      'UPDATE test_event_detail SET createdAt = ? WHERE id = ?',
      [`2026-10-21 ${time}:00`, result.id]
    );
    await dataSource.query('UPDATE test_image SET createdAt = ? WHERE id = ?', [
      `2026-10-21 ${time}:20`,
      screenshot.id
    ]);
    await dataSource.manager.update(TestEventEntity, testEvent.id, {
      latestTestEventDetailId: result.id,
      latestTestImageId: screenshot.id,
      message
    });
    return { runId: result.id, screenshotId: screenshot.id };
  }

  const reload = (id: number) =>
    dataSource.manager.findOneByOrFail(TestEventEntity, { id });
  const remainingRuns = async () =>
    (await dataSource.manager.find(TestEventDetailEntity)).map(
      (remaining) => remaining.id
    );
  const remainingScreenshots = async () =>
    (
      await dataSource.manager.find(TestImageEntity, { select: { id: true } })
    ).map((remaining) => remaining.id);

  it('deletes a latest run and its screenshot, and points the test at the previous run', async () => {
    const demo = await project('demo');
    const cart = await test(demo, 'add_to_cart');
    const old = await run(cart, '10:00', { linked: false, message: 'Old' });
    const latest = await run(cart, '10:05');

    const deleted = await service.deleteRuns('demo', [latest.runId]);

    expect(deleted).toEqual({
      deletedRunIds: [latest.runId],
      latestRunDeletedEventIds: ['add_to_cart']
    });
    expect(await remainingRuns()).toEqual([old.runId]);
    expect(await remainingScreenshots()).toEqual([old.screenshotId]);
    expect(await reload(cart.id)).toMatchObject({
      latestTestEventDetailId: old.runId,
      latestTestImageId: old.screenshotId,
      message: 'Old'
    });
  });

  it("deletes an older run's screenshot saved before runs were linked", async () => {
    const demo = await project('demo');
    const cart = await test(demo, 'add_to_cart');
    const old = await run(cart, '10:00', { linked: false });
    const latest = await run(cart, '10:05', { linked: false });

    const deleted = await service.deleteRuns('demo', [old.runId]);

    expect(deleted.latestRunDeletedEventIds).toEqual([]);
    expect(await remainingRuns()).toEqual([latest.runId]);
    expect(await remainingScreenshots()).toEqual([latest.screenshotId]);
    expect(await reload(cart.id)).toMatchObject({
      latestTestEventDetailId: latest.runId,
      latestTestImageId: latest.screenshotId
    });
  });

  it('leaves a test with no latest run when all its runs are deleted', async () => {
    const demo = await project('demo');
    const cart = await test(demo, 'add_to_cart');
    const first = await run(cart, '10:00');
    const second = await run(cart, '10:05');

    await service.deleteRuns('demo', [first.runId, second.runId]);

    expect(await remainingRuns()).toEqual([]);
    expect(await remainingScreenshots()).toEqual([]);
    expect(await reload(cart.id)).toMatchObject({
      latestTestEventDetailId: null,
      latestTestImageId: null,
      message: ''
    });
  });

  it("ignores another project's runs", async () => {
    const demo = await project('demo');
    const other = await project('other');
    await test(demo, 'add_to_cart');
    const purchase = await test(other, 'purchase');
    const foreign = await run(purchase, '10:00');

    const deleted = await service.deleteRuns('demo', [foreign.runId]);

    expect(deleted.deletedRunIds).toEqual([]);
    expect(await remainingRuns()).toEqual([foreign.runId]);
  });
});
