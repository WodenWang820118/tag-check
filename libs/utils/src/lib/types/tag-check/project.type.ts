import { Auditable } from './auditable.type';

export type ProjectInfo = {
  projectName: string;
  projectDescription?: string;
  measurementId?: string;
};

export type ProjectInfoSchema = {
  id: number;
} & ProjectInfo &
  Auditable;

export type Project = {
  projectSlug: string;
};

export type ProjectSchema = {
  id: number;
} & Project &
  Auditable;

export type TestInfo = {
  testName: string;
  eventName: string;
  passed: boolean;
};

export type TestInfoSchema = {
  id: number;
} & TestInfo &
  Auditable;

export type TestRequestInfo = {
  requestPassed: boolean;
  rawRequest: string;
  destinationUrl: string;
};

export type TestRequestInfoSchema = {
  id: number;
} & TestRequestInfo &
  Auditable;

export type TestEvent = {
  eventId: string;
  message?: string;
};

export type TestEventSchema = {
  id: number;
} & TestEvent &
  Auditable;
