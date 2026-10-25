import type { BatchRunSource } from './batch-run.type';

/** Where a run sits in its batch; absent for a single run. */
export type RunStatusBatch = {
  batchId: number;
  /** 1-based position of the test in the batch. */
  position: number;
  /** How many tests the batch holds. */
  total: number;
  source: BatchRunSource;
};

/** The test a run replays. */
export type RunStatusTest = {
  projectSlug: string;
  eventId: string;
  /** The GA4 event name; the eventId when the test could not be read. */
  eventName: string;
  testName: string;
  batch?: RunStatusBatch;
};

/**
 * Data of the `runStatus` server-sent event (GET /events), sent whenever
 * the backend's run status changes:
 *
 * - `idle`: no run in progress;
 * - `starting`: a run has begun but has not reached its first replay step
 *   yet (the browser is starting, or accompanied mode is opening GTM
 *   Preview);
 * - `running`: the replay is about to run step `currentStep` (1-based) of
 *   `totalSteps`.
 */
export type RunStatusPayload =
  | { state: 'idle' }
  | ({ state: 'starting' } & RunStatusTest)
  | ({
      state: 'running';
      currentStep: number;
      totalSteps: number;
    } & RunStatusTest);

/**
 * How a run ended: its two checks as `getCheckStatus` reads them, `error`
 * when the run threw, or `cancelled` when it was stopped.
 */
export type RunOutcomeStatus =
  | 'passed'
  | 'partial'
  | 'failed'
  | 'error'
  | 'cancelled';

/**
 * Data of the `runFinished` server-sent event, sent when a run ends, a
 * batch's runs included (they carry `batch`).
 */
export type RunFinishedPayload = RunStatusTest & {
  status: RunOutcomeStatus;
  /** Why the run ended in error; otherwise null. */
  message: string | null;
};

/**
 * Data of the `batchFinished` server-sent event, sent once when a batch
 * ends: `completed` when every test ran, `cancelled` when it was cancelled.
 * The counts add up to `total`.
 */
export type BatchFinishedPayload = {
  batchId: number;
  projectSlug: string;
  source: BatchRunSource;
  status: 'completed' | 'cancelled';
  total: number;
  passed: number;
  partial: number;
  failed: number;
  error: number;
  cancelled: number;
};

/**
 * One run status message, as the desktop sidecar writes it to stdout: the
 * line `TAGCHECK_STATUS ` followed by this object as compact JSON. `type` is
 * the name of the matching server-sent event.
 */
export type RunStatusMessage =
  | { type: 'runStatus'; data: RunStatusPayload }
  | { type: 'runFinished'; data: RunFinishedPayload }
  | { type: 'batchFinished'; data: BatchFinishedPayload };
