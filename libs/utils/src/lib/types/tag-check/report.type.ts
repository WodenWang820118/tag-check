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
  rawRequest?: string;
  destinationUrl: string;
  dataLayer?: StrictDataLayerEvent[] | BaseDataLayerEvent[];
};

export type TestEventDetailSchema = {
  id: number;
  /** The run's validation message; null for runs saved before runs kept it. */
  message?: string | null;
} & TestEventDetail &
  Auditable;
