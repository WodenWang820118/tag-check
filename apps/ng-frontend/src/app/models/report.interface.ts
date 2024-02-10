export interface ProjectReport {
  projectSlug: string;
  reports: ReportDetails[];
}

export interface ReportDetails {
  eventName: string;
  passed: boolean;
  dataLayerSpec: any;
  incorrectInfo?: string[];
  completedTime?: Date;
  dataLayer?: any;
  message?: string;
}
