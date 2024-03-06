export interface ProjectReport {
  projectSlug: string;
  reports: IReportDetails[];
}

export interface IReportDetails {
  position: number;
  eventName: string;
  passed: boolean;
  dataLayerSpec: any;
  incorrectInfo?: string[];
  completedTime?: Date;
  dataLayer?: any;
  message?: string;
}
