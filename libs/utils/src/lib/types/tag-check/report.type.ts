import { OutputValidationResult } from './data-layer.type';

export type ProjectReport = {
  projectSlug: string;
  reports: IReportDetails[];
};

export type IReportDetails = {
  position: number;
  eventId: string;
  testName: string;
} & OutputValidationResult;
