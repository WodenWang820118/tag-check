import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEvent } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { BatchUpdatePayload } from '@utils';
import { DATABASE_ENTITIES } from '../../core/database/database-entities';
import { BatchRunRepositoryService } from '../../core/repository/batch-run/batch-run-repository.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ScheduleRepositoryService } from '../../core/repository/schedule/schedule-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { ProgressEventsService } from '../../core/events-gateway/progress-events.service';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ProjectEntity,
  TestEventDetailEntity,
  TestEventEntity
} from '../../shared';
import { TestRunService } from '../test-run/test-run.service';
import { BatchQueueService } from './batch-queue.service';
import { ScheduleService } from './schedule.service';

/**
 * How the fake run of a test ends: saves a result with these checks,
 * throws, saves nothing, or waits until it is stopped.
 */
export type FakeRunBehavior =
  | 'passed'
  | 'partial'
  | 'failed'
  | 'error'
  | 'noResult'
  | 'hang';

/**
 * A TestRunService that saves results straight into the database instead of
 * driving a browser, and records every run.
 */
export class FakeTestRun {
  readonly calls: {
    projectSlug: string;
    eventId: string;
    headless: boolean;
  }[] = [];
  readonly behaviors = new Map<string, FakeRunBehavior>();
  stopCount = 0;
  private readonly hanging = new Set<(error: Error) => void>();
  private startedListeners: ((eventId: string) => void)[] = [];
  dataSource: DataSource | undefined;

  /** Resolves when a run of `eventId` has started. */
  started(eventId: string): Promise<void> {
    if (this.calls.some((call) => call.eventId === eventId)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.startedListeners.push((started) => {
        if (started === eventId) resolve();
      });
    });
  }

  async run(
    projectSlug: string,
    eventId: string,
    choice: { headless: boolean }
  ): Promise<void> {
    this.calls.push({ projectSlug, eventId, headless: choice.headless });
    for (const listener of this.startedListeners) listener(eventId);
    const behavior = this.behaviors.get(eventId) ?? 'passed';
    if (behavior === 'hang') {
      await new Promise<void>((_resolve, reject) => {
        this.hanging.add(reject);
      });
      return;
    }
    if (behavior === 'error') {
      throw new Error(
        'Failed to perform GTM validation: net::ERR_NAME_NOT_RESOLVED at C:\\Users\\me\\run.ts'
      );
    }
    if (behavior === 'noResult') return;
    await this.saveResult(projectSlug, eventId, {
      passed: behavior !== 'failed',
      requestPassed: behavior === 'passed'
    });
  }

  stopAll(): void {
    this.stopCount++;
    for (const reject of this.hanging) {
      reject(new Error('Browser start aborted'));
    }
    this.hanging.clear();
  }

  private async saveResult(
    projectSlug: string,
    eventId: string,
    checks: { passed: boolean; requestPassed: boolean }
  ) {
    if (!this.dataSource) throw new Error('No data source');
    const testEvent = await this.dataSource.manager.findOneOrFail(
      TestEventEntity,
      { where: { eventId, project: { projectSlug } } }
    );
    await this.dataSource.manager.save(TestEventDetailEntity, {
      testEvent,
      ...checks,
      destinationUrl: 'https://shop.example/',
      message: checks.passed ? 'Valid' : 'Missing items'
    });
  }
}

/** The batch queue and schedules on an in-memory SQLite database. */
export interface BatchQueueTestbed {
  moduleRef: TestingModule;
  dataSource: DataSource;
  fakeRun: FakeTestRun;
  batchQueue: BatchQueueService;
  scheduleService: ScheduleService;
  batchRuns: BatchRunRepositoryService;
  /** Every `batchUpdate` event sent. */
  updates: BatchUpdatePayload[];
}

/** The providers of the batch queue, for a testing module. */
export function batchQueueProviders(fakeRun: FakeTestRun) {
  return [
    BatchRunRepositoryService,
    ScheduleRepositoryService,
    ProjectRepositoryService,
    TestEventRepositoryService,
    TestEventDetailRepositoryService,
    ProgressEventsService,
    BatchQueueService,
    ScheduleService,
    { provide: TestRunService, useValue: fakeRun }
  ];
}

/** The SQLite modules of a testing module. */
export function sqliteImports() {
  return [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: DATABASE_ENTITIES,
      synchronize: true,
      dropSchema: true,
      logging: false
    }),
    TypeOrmModule.forFeature(DATABASE_ENTITIES)
  ];
}

/**
 * Builds the queue without starting the application, so lifecycle hooks
 * (resume, the schedule timer) run only when a test calls them.
 */
export async function createBatchQueueTestbed(): Promise<BatchQueueTestbed> {
  const fakeRun = new FakeTestRun();
  const moduleRef = await Test.createTestingModule({
    imports: sqliteImports(),
    providers: batchQueueProviders(fakeRun)
  }).compile();
  const dataSource = moduleRef.get(DataSource);
  fakeRun.dataSource = dataSource;
  const updates: BatchUpdatePayload[] = [];
  moduleRef
    .get(ProgressEventsService)
    .events$.subscribe((event: MessageEvent) => {
      if (event.type === 'batchUpdate') {
        updates.push(event.data as BatchUpdatePayload);
      }
    });
  return {
    moduleRef,
    dataSource,
    fakeRun,
    batchQueue: moduleRef.get(BatchQueueService),
    scheduleService: moduleRef.get(ScheduleService),
    batchRuns: moduleRef.get(BatchRunRepositoryService),
    updates
  };
}

/** A project with its settings and one test per eventId. */
export async function seedProject(
  dataSource: DataSource,
  projectSlug: string,
  eventIds: string[],
  settings: { headless?: boolean } = {}
): Promise<ProjectEntity> {
  const manager = dataSource.manager;
  const project = await manager.save(ProjectEntity, {
    projectSlug,
    projectName: projectSlug,
    measurementId: 'G-TEST'
  });
  await manager.save(ApplicationSettingEntity, {
    project,
    localStorage: { data: [] },
    cookie: { data: [] },
    gtm: {
      isAccompanyMode: false,
      isRequestCheck: true,
      tagManagerUrl: '',
      gtmPreviewModeUrl: ''
    },
    websiteUrl: 'https://shop.example/'
  });
  await manager.save(BrowserSettingEntity, {
    project,
    browser: [],
    headless: settings.headless ?? false
  });
  await manager.save(AuthenticationSettingEntity, {
    project,
    username: '',
    password: ''
  });
  for (const eventId of eventIds) {
    await manager.save(TestEventEntity, {
      project,
      eventId,
      eventName: eventId,
      testName: `Test ${eventId}`,
      message: ''
    });
  }
  return project;
}
