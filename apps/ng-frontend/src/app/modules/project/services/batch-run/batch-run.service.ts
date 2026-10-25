import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  NgZone,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import type {
  BatchRunItemStatus,
  BatchRunStatus,
  BatchUpdatePayload
} from '@utils';
import {
  BatchRunJson,
  BatchRunsService
} from '../../../../shared/services/api/batch-runs/batch-runs.service';
import { apiErrorMessage } from '../../../../shared/services/api/http-error.utils';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressEventsService } from '../../../../shared/services/progress-events/progress-events.service';
import { ReportTableDataSourceModelService } from '../report-table-data-source-model/report-table-data-source-model.service';

export type BatchItemStatus = BatchRunItemStatus;
export type BatchRun = BatchRunJson;
export type BatchItem = BatchRun['items'][number];

/** Where the frontend kept the batch it ran itself, before the backend did. */
const LEGACY_STORAGE_KEY = 'tag-check.batch-run';
const DISMISSED_KEY_PREFIX = 'tag-check.batch-run-dismissed.';
/** How often a batch that has not ended is read again, besides SSE. */
export const BATCH_POLL_INTERVAL_MS = 3000;

/** Item statuses whose run saved a result, which the tests table shows. */
const RESULT_STATUSES: readonly BatchItemStatus[] = [
  'passed',
  'partial',
  'failed'
];

function isActive(status: BatchRunStatus | undefined): boolean {
  return status === 'pending' || status === 'running';
}

function itemRank(status: BatchItemStatus): number {
  return status === 'pending' ? 0 : status === 'running' ? 1 : 2;
}

/**
 * How far a batch has come; it only grows. A poll answered after a newer
 * `batchUpdate` event would otherwise move the panel back.
 */
function progressOf(batch: BatchRun): number {
  const batchRank =
    batch.status === 'pending' ? 0 : batch.status === 'running' ? 1 : 2;
  return batch.items.reduce(
    (sum, item) => sum + itemRank(item.status),
    batchRank
  );
}

function readDismissed(projectSlug: string): number | undefined {
  try {
    const stored = Number(
      localStorage.getItem(`${DISMISSED_KEY_PREFIX}${projectSlug}`)
    );
    return Number.isInteger(stored) && stored > 0 ? stored : undefined;
  } catch {
    return undefined;
  }
}

function writeDismissed(projectSlug: string, batchId: number | null): void {
  try {
    const key = `${DISMISSED_KEY_PREFIX}${projectSlug}`;
    if (batchId === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(batchId));
    }
  } catch {
    // Storage can be unavailable; a cleared batch then shows after a reload.
  }
}

/**
 * The project's current batch, which the backend runs one test at a time
 * (POST /batch-runs/:projectSlug) whether or not a window is open. While
 * the Tests page shows a project, the newest batch is read from the API and
 * kept up to date from `batchUpdate` events, and read again every 3 s while
 * it has not ended. Each test's row is read again from the API when its run
 * saves a result, as a single run updates it.
 */
@Injectable({ providedIn: 'root' })
export class BatchRunService {
  private readonly api = inject(BatchRunsService);
  private readonly progressEvents = inject(ProgressEventsService);
  private readonly testRunningFacade = inject(TestRunningFacadeService);
  private readonly reportService = inject(ReportService);
  private readonly tableModel = inject(ReportTableDataSourceModelService);
  private readonly ngZone = inject(NgZone);

  private readonly state = signal<BatchRun | null>(null);
  private readonly requesting = signal(false);
  private projectSlug: string | null = null;
  private releaseStream: (() => void) | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  /** `batchId:eventId` of the items whose row is up to date. */
  private readonly refreshedRows = new Set<string>();

  readonly batch = this.state.asReadonly();
  /** Whether a batch is waiting or running, or one is being started. */
  readonly isRunning = computed(
    () => this.requesting() || isActive(this.state()?.status)
  );
  readonly currentItem = computed(() =>
    this.state()?.items.find((item) => item.status === 'running')
  );
  readonly doneCount = computed(
    () =>
      this.state()?.items.filter((item) => itemRank(item.status) === 2)
        .length ?? 0
  );
  /** The tests a cancelled batch did not run, which Resume runs. */
  readonly remainingCount = computed(() => {
    const batch = this.state();
    return batch?.status === 'cancelled'
      ? batch.items.filter((item) => item.status === 'cancelled').length
      : 0;
  });
  readonly canResume = computed(
    () =>
      !this.isRunning() &&
      !this.testRunningFacade.isRunningTest$() &&
      this.remainingCount() > 0
  );

  constructor() {
    // The frontend no longer keeps a queue of its own.
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Nothing to remove when storage is unavailable.
    }
    this.progressEvents.batchUpdate$
      .pipe(takeUntilDestroyed())
      .subscribe((update) => this.onBatchUpdate(update));
    inject(DestroyRef).onDestroy(() => this.unwatch());
  }

  /**
   * Shows the project's newest batch and follows it until `unwatch`: the
   * Tests page calls it when it shows a project.
   */
  watch(projectSlug: string): void {
    if (this.projectSlug !== projectSlug) {
      this.state.set(null);
      this.refreshedRows.clear();
      this.stopPolling();
    }
    this.projectSlug = projectSlug;
    this.releaseStream ??= this.progressEvents.hold();
    this.api.getLatest(projectSlug).subscribe({
      next: (batch) => {
        if (this.projectSlug !== projectSlug) {
          return;
        }
        if (batch && !isActive(batch.status)) {
          if (readDismissed(projectSlug) === batch.id) {
            this.state.set(null);
            return;
          }
        }
        // The table was just read from the API: results saved before now
        // are already in it.
        this.apply(batch, { rowsUpToDate: true });
      },
      error: (error: unknown) => console.error(error)
    });
  }

  /** Stops following the batch; it stays shown for the next `watch`. */
  unwatch(): void {
    this.releaseStream?.();
    this.releaseStream = null;
    this.stopPolling();
  }

  /**
   * Enqueues the tests, in this order, as a batch of the project. Ignored
   * while a batch or a single test runs. Resolves to the API's reason when
   * the batch could not be started, otherwise to null.
   */
  async start(
    projectSlug: string,
    eventIds: string[],
    headless: boolean
  ): Promise<string | null> {
    if (
      this.isRunning() ||
      this.testRunningFacade.isRunningTest$() ||
      eventIds.length === 0
    ) {
      return null;
    }
    this.requesting.set(true);
    try {
      const batch = await firstValueFrom(
        this.api.create(projectSlug, { eventIds, headless })
      );
      writeDismissed(projectSlug, null);
      if (this.projectSlug === null || this.projectSlug === projectSlug) {
        this.projectSlug = projectSlug;
        this.apply(batch, { rowsUpToDate: false });
      }
      return null;
    } catch (error) {
      console.error(error);
      return apiErrorMessage(error, 'The batch could not be started.');
    } finally {
      this.requesting.set(false);
    }
  }

  /** Runs, as a new batch, the tests a cancelled batch did not run. */
  async resume(): Promise<string | null> {
    const batch = this.state();
    if (!batch || !this.canResume()) {
      return null;
    }
    const eventIds = batch.items
      .filter((item) => item.status === 'cancelled')
      .map((item) => item.eventId);
    return this.start(batch.projectSlug, eventIds, batch.headless);
  }

  /** Stops the running test and skips the tests that have not run yet. */
  async cancel(): Promise<void> {
    const batch = this.state();
    if (!batch || !isActive(batch.status)) {
      return;
    }
    try {
      const cancelled = await firstValueFrom(
        this.api.cancel(batch.projectSlug, batch.id)
      );
      this.apply(cancelled, { rowsUpToDate: false });
    } catch (error) {
      console.error(error);
    }
  }

  /** Hides a batch that has ended, also after a reload. */
  clear(): void {
    const batch = this.state();
    if (batch && !isActive(batch.status)) {
      writeDismissed(batch.projectSlug, batch.id);
      this.state.set(null);
    }
  }

  /** Shows a batch read from the API, unless a newer state is shown. */
  private apply(
    batch: BatchRun | null,
    { rowsUpToDate }: { rowsUpToDate: boolean }
  ): void {
    const current = this.state();
    if (batch && current?.id === batch.id) {
      if (progressOf(batch) < progressOf(current)) {
        return;
      }
    } else if (batch && current && batch.id < current.id) {
      return;
    }
    if (batch && rowsUpToDate) {
      for (const item of batch.items) {
        if (RESULT_STATUSES.includes(item.status)) {
          this.refreshedRows.add(`${batch.id}:${item.eventId}`);
        }
      }
    }
    this.state.set(batch);
    this.afterChange();
  }

  private onBatchUpdate(update: BatchUpdatePayload): void {
    const projectSlug = this.projectSlug;
    if (projectSlug === null || update.projectSlug !== projectSlug) {
      return;
    }
    const current = this.state();
    if (current?.id === update.batchId) {
      const byEventId = new Map(
        update.items.map((item) => [item.eventId, item])
      );
      if (current.items.every((item) => byEventId.has(item.eventId))) {
        this.state.set({
          ...current,
          status: update.status,
          items: current.items.map((item) => {
            const next = byEventId.get(item.eventId);
            return next
              ? { ...item, status: next.status, message: next.message }
              : item;
          })
        });
        this.afterChange();
        return;
      }
    } else if (current && update.batchId < current.id) {
      return;
    }
    // A batch this page has not seen, such as one a schedule started.
    this.api.get(projectSlug, update.batchId).subscribe({
      next: (batch) => {
        if (this.projectSlug === projectSlug) {
          this.apply(batch, { rowsUpToDate: false });
        }
      },
      error: (error: unknown) => console.error(error)
    });
  }

  private afterChange(): void {
    const batch = this.state();
    if (batch) {
      this.refreshRows(batch);
    }
    if (batch && isActive(batch.status) && this.releaseStream) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  /** Reads again the row of each test whose run saved a result since. */
  private refreshRows(batch: BatchRun): void {
    for (const item of batch.items) {
      const key = `${batch.id}:${item.eventId}`;
      if (
        !RESULT_STATUSES.includes(item.status) ||
        this.refreshedRows.has(key)
      ) {
        continue;
      }
      this.refreshedRows.add(key);
      this.reportService
        .getReportDetails(batch.projectSlug, item.eventId)
        .subscribe({
          next: (report) =>
            this.tableModel.applyRunResult(item.eventId, report),
          error: (error: unknown) => console.error(error)
        });
    }
  }

  private startPolling(): void {
    if (this.pollTimer !== null) {
      return;
    }
    // Outside Angular's zone, so that a running batch does not keep the
    // app from becoming stable; each poll runs back inside it.
    this.pollTimer = this.ngZone.runOutsideAngular(() =>
      setInterval(
        () => this.ngZone.run(() => this.poll()),
        BATCH_POLL_INTERVAL_MS
      )
    );
  }

  private poll(): void {
    const batch = this.state();
    if (!batch || !isActive(batch.status)) {
      this.stopPolling();
      return;
    }
    this.api.get(batch.projectSlug, batch.id).subscribe({
      next: (next) => {
        if (this.projectSlug === next.projectSlug) {
          this.apply(next, { rowsUpToDate: false });
        }
      },
      error: (error: unknown) => console.error(error)
    });
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
