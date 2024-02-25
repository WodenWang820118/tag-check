export interface ProjectReport {
  projectSlug: string;
  reports: IReportDetails[];
}

export interface IReportDetails {
  eventName: string;
  passed: boolean;
  dataLayerSpec: any;
  incorrectInfo?: string[];
  completedTime?: Date;
  dataLayer?: any;
  message?: string;
}
