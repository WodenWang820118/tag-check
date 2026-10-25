/** Who started a batch: a person (Run selected) or a schedule. */
export type BatchRunSource = 'manual' | 'schedule';

/**
 * A batch's state. A batch waits (`pending`) until the batches enqueued
 * before it have ended, runs its tests one at a time, and ends `completed`
 * (every test ran, whatever the results) or `cancelled`.
 */
export type BatchRunStatus = 'pending' | 'running' | 'completed' | 'cancelled';

/**
 * One test of a batch. `passed`, `partial` and `failed` come from the run's
 * two checks, as `getCheckStatus` reads them; `error` means the run threw
 * before its result was saved; `cancelled` means the batch was cancelled
 * before or while the test ran.
 */
export type BatchRunItemStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'partial'
  | 'failed'
  | 'error'
  | 'cancelled';

/** Body of POST /batch-runs/:projectSlug. */
export type CreateBatchRunRequest = {
  /** The tests to run, in the order they run (the tests table's order). */
  eventIds: string[];
  /** Run every test of the batch headless, whatever the project's setting. */
  headless: boolean;
};

/** One test of a batch, as the batch-runs endpoints return it. */
export type BatchRunItemResponse = {
  id: number;
  eventId: string;
  testName: string;
  eventName: string;
  /** 0-based position in the batch; items run in this order. */
  position: number;
  status: BatchRunItemStatus;
  /** Why the item ended in error or was cancelled; otherwise null. */
  message: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  /**
   * The run's result (TestEventDetail id), once saved. Null before the run,
   * for an item that errored or was cancelled, or once the run is deleted.
   */
  testEventDetailId: number | null;
};

/**
 * A batch as the batch-runs endpoints return it: GET returns a list of them,
 * newest first, and POST, GET by id and cancel return one.
 */
export type BatchRunResponse = {
  id: number;
  projectSlug: string;
  source: BatchRunSource;
  /** The schedule that started the batch; null for a manual batch or a deleted schedule. */
  scheduleId: number | null;
  headless: boolean;
  status: BatchRunStatus;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** Ordered by position. */
  items: BatchRunItemResponse[];
};

/** One item of a `batchUpdate` event. */
export type BatchUpdateItem = {
  eventId: string;
  status: BatchRunItemStatus;
  message: string | null;
};

/**
 * Data of the `batchUpdate` server-sent event (GET /events), sent when a
 * batch is created, starts, cancelled or ended and whenever one of its items
 * changes status.
 */
export type BatchUpdatePayload = {
  batchId: number;
  projectSlug: string;
  status: BatchRunStatus;
  items: BatchUpdateItem[];
};
