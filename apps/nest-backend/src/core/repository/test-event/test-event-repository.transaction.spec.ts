import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { TestEventRepositoryService } from './test-event-repository.service';

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

describe('TestEventRepositoryService.updateTestEvents transaction (SQLite)', () => {
  let module: TestingModule;
  let service: TestEventRepositoryService;
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
      providers: [TestEventRepositoryService]
    }).compile();
    service = module.get(TestEventRepositoryService);
    dataSource = module.get(DataSource);
  });

  afterEach(async () => {
    await module?.close();
  });

  async function createProject(projectSlug: string) {
    return await dataSource.manager.save(ProjectEntity, {
      projectSlug,
      projectName: projectSlug
    });
  }

  async function createTest(
    projectEntity: ProjectEntity,
    eventId: string,
    opts: { stopNavigation?: boolean; message?: string } = {}
  ) {
    return await dataSource.manager.save(TestEventEntity, {
      project: projectEntity,
      eventId,
      eventName: eventId,
      testName: eventId,
      message: opts.message ?? 'original message',
      stopNavigation: opts.stopNavigation ?? false
    });
  }

  it('rolls back earlier rows when a save fails in the batch', async () => {
    const demoProject = await createProject('demo');
    await createTest(demoProject, 'event-1', {
      stopNavigation: false,
      message: 'original 1'
    });
    await createTest(demoProject, 'event-2', {
      stopNavigation: false,
      message: 'original 2'
    });

    const testEventRepo = dataSource.getRepository(TestEventEntity);
    const origTransaction = testEventRepo.manager.transaction.bind(
      testEventRepo.manager
    );

    vi.spyOn(testEventRepo.manager, 'transaction').mockImplementation(
      async (runInTransaction) => {
        return await origTransaction(async (entityManager) => {
          const repo = entityManager.getRepository(TestEventEntity);
          const origSave = repo.save.bind(repo);
          let saveCount = 0;
          vi.spyOn(repo, 'save').mockImplementation(
            async (entity: unknown, options?: unknown) => {
              saveCount++;
              if (saveCount === 2) {
                throw new Error('Simulated failure during second save');
              }
              if (options !== undefined) {
                return await origSave(entity as never, options as never);
              }
              return await origSave(entity as never);
            }
          );
          return await runInTransaction(entityManager);
        });
      }
    );

    await expect(
      service.updateTestEvents('demo', [
        { eventId: 'event-1', stopNavigation: true, message: 'updated 1' },
        { eventId: 'event-2', stopNavigation: true, message: 'updated 2' }
      ])
    ).rejects.toThrow('Simulated failure during second save');

    // Both rows in the database must be unchanged because the transaction rolled back
    const event1 = await dataSource
      .getRepository(TestEventEntity)
      .findOneBy({ eventId: 'event-1' });
    const event2 = await dataSource
      .getRepository(TestEventEntity)
      .findOneBy({ eventId: 'event-2' });

    expect(event1).not.toBeNull();
    expect(event1?.stopNavigation).toBe(false);
    expect(event1?.message).toBe('original 1');

    expect(event2).not.toBeNull();
    expect(event2?.stopNavigation).toBe(false);
    expect(event2?.message).toBe('original 2');
  });

  it('successfully commits all updates in one transaction when all saves succeed', async () => {
    const demoProject = await createProject('demo');
    await createTest(demoProject, 'event-1', {
      stopNavigation: false,
      message: 'original 1'
    });
    await createTest(demoProject, 'event-2', {
      stopNavigation: false,
      message: 'original 2'
    });

    const result = await service.updateTestEvents('demo', [
      { eventId: 'event-1', stopNavigation: true, message: 'updated 1' },
      { eventId: 'event-2', stopNavigation: true, message: 'updated 2' }
    ]);

    expect(result).toHaveLength(2);

    const event1 = await dataSource
      .getRepository(TestEventEntity)
      .findOneBy({ eventId: 'event-1' });
    const event2 = await dataSource
      .getRepository(TestEventEntity)
      .findOneBy({ eventId: 'event-2' });

    expect(event1?.stopNavigation).toBe(true);
    expect(event1?.message).toBe('updated 1');
    expect(event2?.stopNavigation).toBe(true);
    expect(event2?.message).toBe('updated 2');
  });
});
