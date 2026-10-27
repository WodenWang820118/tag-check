import type { StepFailureSummary } from './step-failure.type';
import { Auditable } from './auditable.type';
import { AbstractTestEvent } from './project.type';
import { TestEventDetailSchema } from './report.type';

/**
 * A run's screenshot without its bytes. GET /projects/images/:projectSlug/:eventId
 * serves the image itself.
 */
export type TestImageSummary = {
  id: number;
  imageName: string;
  imageSize?: number;
} & Auditable;

/**
 * A type as it arrives over HTTP: JSON turns dates into ISO strings. Use it
 * for recorded responses; the backend types keep Date.
 */
export type Jsonified<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? Jsonified<Item>[]
    : T extends object
      ? { [Key in keyof T]: Jsonified<T[Key]> }
      : T;

/**
 * One item of GET /file-reports/:projectSlug: a single run of a test and its
 * two check results. The Reports page lists them, newest first.
 */
export type RunSummary = {
  /** The run's result id (TestEventDetail). */
  runId: number;
  eventId: string;
  eventName: string;
  testName: string;
  passed: boolean;
  requestPassed: boolean;
  /** When the run's result was saved. */
  runAt: Date;
};

/** Body of DELETE /file-reports/:projectSlug?runIds=1,2. */
export type DeleteRunsResponse = {
  /** The runs that were deleted; ids of other projects' runs are ignored. */
  deletedRunIds: number[];
};

/**
 * Body of GET /reports/:projectSlug/:eventId, and of each item the run
 * endpoints (POST /datalayer/...) return.
 */
export type ReportDetailResponse = {
  testEvent: AbstractTestEvent;
  /**
   * The chosen run's result (GET .../:eventId?run=<runId>), the latest run's
   * by default, or null before the first run.
   */
  testEventDetails: TestEventDetailSchema | null;
  /** That run's screenshot, or null when it has none. */
  testImage: TestImageSummary | null;
  /** Every run of the test, newest first. */
  runs: RunHistoryEntry[];
  /**
   * The step of that run that could not find its element, when the run
   * kept what the step saw; null otherwise.
   */
  stepFailure: StepFailureSummary | null;
};

/** One run in a test's history (ReportDetailResponse.runs). */
export type RunHistoryEntry = {
  runId: number;
  passed: boolean;
  requestPassed: boolean;
  /** When the run's result was saved. */
  runAt: Date;
  /**
   * Whether the run's screen recordings are kept: the latest runs of a test
   * keep theirs (RUN_RECORDINGS_KEPT), older runs only their screenshot.
   */
  hasRecording: boolean;
};

/** How many of a test's latest runs keep their screen recordings. */
export const RUN_RECORDINGS_KEPT = 10;
