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
} & TestEventSchema;

export type FullTestEventSchema = {
  testEventDetails: TestEventDetailSchema;
  testImage: TestImageSchema[];
  project: ProjectSchema;
} & TestEventSchema;
