export interface Project {
  rootProject: string;
  projectName: string;
  projectSlug: string;
  testType: string;
  projectDescription: string;
  googleSpreadsheetLink: string;
  tagManagerUrl: string;
  version: string;
  preventNavigationEvents: string[];
  recordings: {
    name: string;
    path: string;
  }[];
  reports: TestCase[];
  specs: any[];
}

export interface TestCase {
  eventName: string;
  passed: boolean;
  dataLayerSpec: any;
  incorrectInfo?: string[];
  completedTime?: Date;
  dataLayer?: any;
  message?: string;
}
