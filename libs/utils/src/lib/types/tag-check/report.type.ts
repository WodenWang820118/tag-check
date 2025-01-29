import { Auditable } from './auditable.type';
import { TestDataLayer } from './data-layer.type';
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
