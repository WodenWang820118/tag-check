import { Auditable } from './auditable.type';
import { TestImageSchema } from './file-report.type';
import { TestEventDetailSchema } from './report.type';

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
  message?: string;
};

export type TestEventSchema = {
  id: number;
} & TestEvent &
  Auditable;

export type FullTestEventSchema = {
  testEventDetail: TestEventDetailSchema[];
  testImage: TestImageSchema;
  project: ProjectSchema;
} & TestEventSchema;
