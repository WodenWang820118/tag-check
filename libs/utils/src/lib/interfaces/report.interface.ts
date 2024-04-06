import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
} from './data-layer.interface';

export interface ProjectReport {
  projectSlug: string;
  reports: IReportDetails[];
}

export interface IReportDetails {
  position: number;
  eventName: string;
  passed: boolean;
  incorrectInfo?: string[];
  completedTime?: Date;
  dataLayerSpec: StrictDataLayerEvent | BaseDataLayerEvent;
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
  message?: string;
  requestPassed?: boolean;
  rawRequest?: string;
}
