import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getCheckStatus, ReportDetailResponse } from '@utils';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';

export type BatchItemStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'partial'
  | 'failed'
  | 'error'
  | 'cancelled';

export type BatchItem = {
  eventId: string;
  eventName: string;
  status: BatchItemStatus;
  /** Why a run ended in error, as the API or the browser reported it. */
  message?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type BatchRun = {
  projectSlug: string;
  items: BatchItem[];
  startedAt: string;
  finishedAt?: string;
};

export type BatchTest = Pick<BatchItem, 'eventId' | 'eventName'>;

const STORAGE_KEY = 'tag-check.batch-run';

/**
 * Runs a list of tests one after another, the same way as the play button,
 * in accompanied mode when the project uses it. Each test's browser is closed
 * when its run ends, so a batch does not leave a GTM Preview window per test.
 * Each test's result is saved as a normal run. The batch is kept in
 * localStorage so that tests still pending after a reload or a restart can
 * be resumed.
 */
@Injectable({ providedIn: 'root' })
export class BatchRunService {
  private readonly testRunningFacade = inject(TestRunningFacadeService);

  private readonly state = signal<BatchRun | null>(readStoredBatch());
  private readonly running = signal(false);
  private cancelRequested = false;

  readonly batch = this.state.asReadonly();
  readonly isRunning = this.running.asReadonly();
  readonly currentItem = computed(() =>
    this.state()?.items.find((item) => item.status === 'running')
  );
  readonly doneCount = computed(
    () =>
      this.state()?.items.filter(
        (item) => item.status !== 'pending' && item.status !== 'running'
      ).length ?? 0
  );
  readonly canResume = computed(
    () =>
      !this.running() &&
      (this.state()?.items.some((item) => item.status === 'pending') ?? false)
  );

  /** Starts a new batch; ignored while another batch is running. */
  async start(projectSlug: string, tests: BatchTest[]): Promise<void> {
    if (this.running() || tests.length === 0) {
      return;
    }
    this.save({
      projectSlug,
      startedAt: new Date().toISOString(),
      items: tests.map(({ eventId, eventName }) => ({
        eventId,
        eventName,
        status: 'pending'
      }))
    });
    await this.runPending();
  }

  /** Runs the tests a stopped or interrupted batch has not run yet. */
  async resume(): Promise<void> {
    if (!this.canResume()) {
      return;
    }
    await this.runPending();
  }

  /** Stops the running test and skips the tests that have not run yet. */
  async cancel(): Promise<void> {
    if (!this.running()) {
      return;
    }
    this.cancelRequested = true;
    await firstValueFrom(this.testRunningFacade.stopOperation());
  }

  /** Forgets a batch that is not running. */
  clear(): void {
    if (!this.running()) {
      this.save(null);
    }
  }

  private async runPending(): Promise<void> {
    this.running.set(true);
    this.cancelRequested = false;
    this.update((batch) => ({ ...batch, finishedAt: undefined }));
    try {
      let next = this.nextPending();
      while (next && !this.cancelRequested) {
        await this.runItem(next);
        next = this.nextPending();
      }
      if (this.cancelRequested) {
        this.markPending('cancelled');
      }
      this.update((batch) => ({
        ...batch,
        finishedAt: new Date().toISOString()
      }));
    } finally {
      this.running.set(false);
      this.cancelRequested = false;
    }
  }

  private async runItem(item: BatchItem): Promise<void> {
    const projectSlug = this.state()?.projectSlug;
    if (!projectSlug) {
      return;
    }
    this.setItem(item.eventId, {
      status: 'running',
      message: undefined,
      startedAt: new Date().toISOString(),
      finishedAt: undefined
    });
    try {
      const report = await firstValueFrom(
        this.testRunningFacade.runTestForReport(item.eventId, projectSlug, {
          closeBrowser: true
        })
      );
      this.setItem(item.eventId, {
        ...statusOf(report),
        finishedAt: new Date().toISOString()
      });
    } catch (error) {
      this.setItem(item.eventId, {
        status: this.cancelRequested ? 'cancelled' : 'error',
        message: errorMessage(error),
        finishedAt: new Date().toISOString()
      });
    }
  }

  private nextPending(): BatchItem | undefined {
    return this.state()?.items.find((item) => item.status === 'pending');
  }

  private markPending(status: BatchItemStatus): void {
    this.update((batch) => ({
      ...batch,
      items: batch.items.map((item) =>
        item.status === 'pending' ? { ...item, status } : item
      )
    }));
  }

  private setItem(eventId: string, changes: Partial<BatchItem>): void {
    this.update((batch) => ({
      ...batch,
      items: batch.items.map((item) =>
        item.eventId === eventId ? { ...item, ...changes } : item
      )
    }));
  }

  private update(change: (batch: BatchRun) => BatchRun): void {
    const batch = this.state();
    if (batch) {
      this.save(change(batch));
    }
  }

  private save(batch: BatchRun | null): void {
    this.state.set(batch);
    try {
      if (batch) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(batch));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode); the batch still runs.
    }
  }
}

function statusOf(
  report: ReportDetailResponse | undefined
): Pick<BatchItem, 'status' | 'message'> {
  const details = report?.testEventDetails;
  if (!details) {
    return { status: 'error', message: 'The run returned no result.' };
  }
  return { status: getCheckStatus(details.passed, details.requestPassed) };
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
    ) {
      return body.message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

const ITEM_STATUSES: readonly BatchItemStatus[] = [
  'pending',
  'running',
  'passed',
  'partial',
  'failed',
  'error',
  'cancelled'
];

function isBatchItem(value: unknown): value is BatchItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'eventId' in value &&
    typeof value.eventId === 'string' &&
    'eventName' in value &&
    typeof value.eventName === 'string' &&
    'status' in value &&
    ITEM_STATUSES.some((status) => status === value.status)
  );
}

/**
 * Reads the stored batch. A test that was running when the page closed did
 * not finish, so it is pending again.
 */
function readStoredBatch(): BatchRun | null {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null'
    );
    if (
      typeof stored !== 'object' ||
      stored === null ||
      !('projectSlug' in stored) ||
      typeof stored.projectSlug !== 'string' ||
      !('startedAt' in stored) ||
      typeof stored.startedAt !== 'string' ||
      !('items' in stored) ||
      !Array.isArray(stored.items) ||
      !stored.items.every(isBatchItem)
    ) {
      return null;
    }
    const items: BatchItem[] = stored.items.map((item: BatchItem) =>
      item.status === 'running' ? { ...item, status: 'pending' } : item
    );
    return {
      projectSlug: stored.projectSlug,
      startedAt: stored.startedAt,
      items
    };
  } catch {
    return null;
  }
}
