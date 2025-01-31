import { Auditable } from './auditable.type';
import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestDataLayer
} from './data-layer.type';
import { TestEvent, TestInfo, TestRequestInfo } from './project.type';

export type ProjectReport = {
  projectSlug: string;
  reports: IReportDetails[];
};

export type IReportDetails = {
  position: number;
} & TestEvent &
  TestInfo &
  TestRequestInfo &
  TestDataLayer &
  Auditable;

export type TestEventDetail = {
  passed: boolean;
  requestPassed: boolean;
  rawRequest?: string;
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
  destinationUrl: string;
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
};

export type TestEventDetailSchema = {
  id: number;
} & TestEventDetail &
  Auditable;
