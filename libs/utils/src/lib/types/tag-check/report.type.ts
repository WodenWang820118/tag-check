import { Auditable } from './auditable.type';
import { BaseDataLayerEvent, StrictDataLayerEvent } from './data-layer.type';
import { TestEvent } from './project.type';

export type IReportDetails = {
  position: number;
  event: string;
  hasRecording?: boolean;
  /** When the latest run ran; null when the test has no run. */
  lastRunAt?: Date | string | null;
} & TestEvent &
  TestEventDetail &
  Auditable;

export type TestEventDetail = {
  passed: boolean;
  requestPassed: boolean;
  /**
   * Whether the run made the GA4 request check (Request Check on in the
   * project's GTM settings). Missing for runs saved before it was recorded:
   * read missing as true.
   */
  requestChecked?: boolean;
  rawRequest?: string;
  destinationUrl: string;
  dataLayer?: StrictDataLayerEvent[] | BaseDataLayerEvent[];
};

/**
 * When the run's recorded steps acted, on the run's site recording: each
 * step's offset from the recording's first frame, so a player can seek to
 * a step. Steps are numbered by their position in the recording (0-based).
 */
export type RunMediaTimeline = {
  steps: { index: number; atMs: number }[];
  /**
   * How much later the Tag Assistant recording started than the site
   * recording (negative when it started earlier); null without one.
   */
  tagAssistantOffsetMs: number | null;
};

export type TestEventDetailSchema = {
  id: number;
  /** The run's validation message; null for runs saved before runs kept it. */
  message?: string | null;
  /**
   * The GA4 request check's message, such as "No GA4 request for
   * add_to_cart was captured"; null when the run did not check the request
   * or was saved before runs kept it.
   */
  requestMessage?: string | null;
  /** Null for runs without a recording or saved before runs kept it. */
  mediaTimeline?: RunMediaTimeline | null;
} & TestEventDetail &
  Auditable;
