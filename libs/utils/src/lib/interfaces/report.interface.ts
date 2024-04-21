import { OutputValidationResult } from './data-layer.interface';

export interface ProjectReport {
  projectSlug: string;
  reports: IReportDetails[];
}

export interface IReportDetails extends OutputValidationResult {
  position: number;
  eventId: string;
  testName: string;
}
