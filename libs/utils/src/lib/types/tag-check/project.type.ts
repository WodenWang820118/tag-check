import { Auditable } from './auditable.type';
import { TestImageSchema } from './file-report.type';
import { Recording } from './recording.type';
import { TestEventDetailSchema } from './report.type';
import { Spec } from './spec.type';

export type Project = {
  projectSlug: string;
  projectName: string;
  projectDescription?: string;
  measurementId?: string;
};

export type ProjectSchema = {
  id: number;
} & Project &
  Auditable;

export type TestEvent = {
  eventName: string;
  testName: string;
  eventId: string;
  stopNavigation?: boolean;
  message: string;
} & Auditable;

export type TestEventSchema = {
  id: number;
  latestTestEventDetailId?: number | null;
  latestTestImageId?: number | null;
  latestTestEventDetail?: TestEventDetailSchema;
  latestTestImage?: TestImageSchema;
} & TestEvent &
  Auditable;

export type AbstractTestEvent = {
  recording?: Recording;
  spec?: Spec;
  hasRecording?: boolean;
  // GET /reports/:projectSlug flattens the latest result onto each test
  // (AbstractTestEventResponseDto); it does not send latestTestEventDetail.
  passed?: boolean;
  requestPassed?: boolean;
  /** When the latest run ran; null when the test has no run. */
  lastRunAt?: Date | null;
} & TestEventSchema;

export type FullTestEventSchema = {
  testEventDetails: TestEventDetailSchema;
  project: ProjectSchema;
} & TestEventSchema;
