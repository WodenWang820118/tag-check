import {
  BadRequestException,
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationBootstrap
} from '@nestjs/common';
import type { BatchRunResponse, BatchRunSource } from '@utils';
import { BatchRunRepositoryService } from '../../core/repository/batch-run/batch-run-repository.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { ProgressEventsService } from '../../core/events-gateway/progress-events.service';
import type { BatchRunItemEntity } from '../../shared';
import { TestRunService } from '../test-run/test-run.service';
import {
  type ItemOutcome,
  toBatchRunResponse,
  toBatchUpdatePayload,
  toItemOutcome
} from './batch-run.mapper';

/** The message of an item the batch's cancel ended. */
export const CANCELLED_MESSAGE = 'Cancelled';

/** The most tests one batch may hold. */
export const MAX_BATCH_TESTS = 1000;

/** How a batch is enqueued. */
export interface EnqueueOptions {
  source: BatchRunSource;
  /** Run headless; by default, the project's browser setting. */
  headless?: boolean;
  scheduleId?: number | null;
  /**
   * Leave out tests the project no longer has (a schedule's deleted tests)
   * instead of rejecting the batch.
   */
  skipMissingTests?: boolean;
}

/**
 * Runs batches of tests in the backend, so a batch outlives the window that
 * started it.
 *
 * Batches run in the order they were created (FIFO), one test at a time.
 * Each test runs through TestRunService, which waits in the RunQueueService
 * shared with single runs, so a single run and a batch never overlap.
 * Every change is saved and sent as a `batchUpdate` event (GET /events).
 *
 * When the backend starts, items left running by a backend that stopped
 * mid-run are requeued, and unfinished batches resume.
 */
@Injectable()
export class BatchQueueService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(BatchQueueService.name);
  /** The queue's worker while it runs. */
  private draining: Promise<void> | null = null;
  /** Set by every enqueue; the worker looks for batches again while it is set. */
  private wakeRequested = false;
  private shuttingDown = false;
  /** The item whose run is in progress. */
  private running: { batchId: number; itemId: number } | null = null;

  constructor(
    private readonly batchRuns: BatchRunRepositoryService,
    private readonly projects: ProjectRepositoryService,
    private readonly testEvents: TestEventRepositoryService,
    private readonly testEventDetails: TestEventDetailRepositoryService,
    private readonly testRunService: TestRunService,
    private readonly progressEvents: ProgressEventsService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.resume();
  }

  beforeApplicationShutdown(): void {
    // The item in progress stays `running` and is requeued on the next start.
    this.shuttingDown = true;
  }

  /**
   * Requeues the items left running and starts the worker on the
   * unfinished batches. Never throws: the backend starts without its queue.
   */
  async resume(): Promise<void> {
    try {
      const requeued = await this.batchRuns.requeueRunningItems();
      const open = await this.batchRuns.listOpenIds();
      if (requeued > 0 || open.length > 0) {
        this.logger.log(
          `Resuming ${open.length} unfinished batch(es); ${requeued} interrupted test run(s) requeued`
        );
      }
      if (open.length > 0) {
        this.wake();
      }
    } catch (error) {
      this.logger.error(`Could not resume the batch queue: ${error}`);
    }
  }

  /**
   * Creates a batch of the project's tests, in the given order, and queues
   * it behind the batches created before it.
   *
   * @throws BadRequestException for an empty list, too many tests or tests
   * the project does not have (unless `skipMissingTests`).
   * @throws HttpException 404 for an unknown project.
   */
  async enqueue(
    projectSlug: string,
    eventIds: string[],
    options: EnqueueOptions
  ): Promise<BatchRunResponse> {
    if (eventIds.length > MAX_BATCH_TESTS) {
      throw new BadRequestException(
        `A batch runs at most ${MAX_BATCH_TESTS} tests`
      );
    }
    const project = await this.projects.getRunSettingsEntityBySlug(projectSlug);
    const found = await this.testEvents.listEntitiesBySlugAndEventIds(
      projectSlug,
      [...new Set(eventIds)]
    );
    const byEventId = new Map(found.map((test) => [test.eventId, test]));
    const missing = eventIds.filter((eventId) => !byEventId.has(eventId));
    if (missing.length > 0 && !options.skipMissingTests) {
      throw new BadRequestException(
        `The project has no tests with these eventIds: ${missing.join(', ')}`
      );
    }
    const tests = eventIds.flatMap((eventId) => {
      const test = byEventId.get(eventId);
      return test ? [test] : [];
    });
    if (tests.length === 0) {
      throw new BadRequestException('The batch has no tests to run');
    }

    const batch = await this.batchRuns.create(project, tests, {
      source: options.source,
      headless: options.headless ?? project.browserSettings?.headless ?? false,
      scheduleId: options.scheduleId ?? null
    });
    this.logger.log(
      `Enqueued batch ${batch.id} of ${projectSlug}: ${tests.length} test(s), source=${batch.source}, headless=${batch.headless}`
    );
    this.progressEvents.sendBatchUpdate(toBatchUpdatePayload(batch));
    this.wake();
    return toBatchRunResponse(batch);
  }

  /** @throws HttpException 404 when the project has no such batch. */
  async get(projectSlug: string, batchId: number): Promise<BatchRunResponse> {
    return toBatchRunResponse(
      await this.batchRuns.getForProject(projectSlug, batchId)
    );
  }

  /**
   * The project's latest batches, newest first.
   *
   * @throws HttpException 404 for an unknown project.
   */
  async list(projectSlug: string, limit: number): Promise<BatchRunResponse[]> {
    await this.projects.getEntityBySlug(projectSlug);
    const batches = await this.batchRuns.listForProject(projectSlug, limit);
    return batches.map(toBatchRunResponse);
  }

  /**
   * Cancels a batch: its pending items, and the running one, end cancelled,
   * and the running one's browser is closed. Cancelling a batch that has
   * ended changes nothing.
   *
   * Stopping the running test also drops the single runs queued behind it,
   * as the stop endpoints do: they share one queue.
   *
   * @throws HttpException 404 when the project has no such batch.
   */
  async cancel(
    projectSlug: string,
    batchId: number
  ): Promise<BatchRunResponse> {
    const batch = await this.batchRuns.getForProject(projectSlug, batchId);
    const now = new Date();
    const cancelled = await this.batchRuns.updateBatchIf(
      batchId,
      ['pending', 'running'],
      { status: 'cancelled', finishedAt: now }
    );
    if (!cancelled) {
      return toBatchRunResponse(batch);
    }
    await this.batchRuns.cancelOpenItems(batchId, CANCELLED_MESSAGE, now);
    if (this.running?.batchId === batchId) {
      this.logger.log(
        `Stopping the running test of cancelled batch ${batchId}`
      );
      this.testRunService.stopAll();
    }
    const updated = await this.batchRuns.getById(batchId);
    this.progressEvents.sendBatchUpdate(toBatchUpdatePayload(updated));
    return toBatchRunResponse(updated);
  }

  /**
   * Starts the worker, or asks the running one to look for batches again
   * once it has finished the ones it knows about.
   */
  private wake(): void {
    this.wakeRequested = true;
    if (this.draining || this.shuttingDown) {
      return;
    }
    this.draining = this.drain()
      .catch((error) => {
        this.logger.error(`The batch queue stopped: ${error}`);
      })
      .finally(() => {
        this.draining = null;
        // An enqueue may have come in after the worker's last look.
        if (this.wakeRequested && !this.shuttingDown) {
          this.wake();
        }
      });
  }

  /** Runs every unfinished batch, oldest first, until none is left. */
  private async drain(): Promise<void> {
    while (this.wakeRequested && !this.shuttingDown) {
      this.wakeRequested = false;
      for (const batchId of await this.batchRuns.listOpenIds()) {
        if (this.shuttingDown) return;
        await this.runBatch(batchId);
      }
    }
  }

  /** Waits until the worker is idle; for tests. */
  async whenIdle(): Promise<void> {
    while (this.draining) {
      await this.draining;
    }
  }

  private async runBatch(batchId: number): Promise<void> {
    const batch = await this.batchRuns.getById(batchId);
    if (batch.status === 'pending') {
      await this.batchRuns.updateBatchIf(batchId, ['pending'], {
        status: 'running',
        startedAt: new Date()
      });
      await this.emit(batchId);
    }

    while (!this.shuttingDown) {
      const item = await this.batchRuns.nextPendingItem(batchId);
      if (!item) break;
      // A cancel between the read and this claim leaves the item cancelled.
      const claimed = await this.batchRuns.updateItemIf(item.id, ['pending'], {
        status: 'running',
        startedAt: new Date()
      });
      if (!claimed) continue;

      this.running = { batchId, itemId: item.id };
      await this.emit(batchId);
      let outcome: ItemOutcome;
      try {
        outcome = await this.runItem(
          batch.project.projectSlug,
          item,
          batch.headless
        );
      } finally {
        this.running = null;
      }
      if (this.shuttingDown) return;
      // A cancelled item keeps its status, whatever its run did.
      await this.batchRuns.updateItemIf(item.id, ['running'], {
        ...outcome,
        finishedAt: new Date()
      });
      await this.emit(batchId);
    }

    if (this.shuttingDown) return;
    const completed = await this.batchRuns.updateBatchIf(batchId, ['running'], {
      status: 'completed',
      finishedAt: new Date()
    });
    if (completed) {
      this.logger.log(`Batch ${batchId} completed`);
      await this.emit(batchId);
    }
  }

  /** Runs the item's test and reads the result it saved. */
  private async runItem(
    projectSlug: string,
    item: BatchRunItemEntity,
    headless: boolean
  ): Promise<ItemOutcome> {
    const testEventId = item.testEvent.id;
    const before = await this.testEventDetails.getLatestRunResult(testEventId);
    let failure: { error: unknown } | undefined;
    try {
      await this.testRunService.run(projectSlug, item.testEvent.eventId, {
        headless
      });
    } catch (error) {
      this.logger.warn(
        `Batch test ${projectSlug}/${item.testEvent.eventId} failed: ${error}`
      );
      failure = { error };
    }
    const after = await this.testEventDetails.getLatestRunResult(testEventId);
    const saved = after && after.id !== before?.id ? after : null;
    return toItemOutcome(saved, failure);
  }

  /** Sends the batch's current state; a failure to read it is only logged. */
  private async emit(batchId: number): Promise<void> {
    try {
      const batch = await this.batchRuns.getById(batchId);
      this.progressEvents.sendBatchUpdate(toBatchUpdatePayload(batch));
    } catch (error) {
      this.logger.warn(
        `Could not send the update of batch ${batchId}: ${error}`
      );
    }
  }
}
