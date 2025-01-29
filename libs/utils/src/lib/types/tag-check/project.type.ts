import { Auditable } from './auditable.type';
import { StrictDataLayerEvent, BaseDataLayerEvent } from './data-layer.type';

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
  rawRequest?: string;
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
  destinationUrl: string;
};

export type TestRequestInfoSchema = {
  id: number;
} & TestRequestInfo &
  Auditable;

export type TestEvent = {
  testName: string;
  eventName: string;
  eventId: string;
  stopNavigation?: boolean;
  message?: string;
};

export type TestEventSchema = {
  id: number;
} & TestEvent &
  Auditable;
