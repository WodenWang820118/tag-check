import { Application, Authentication, Gtm } from './setting.interface';

export interface Project {
  rootProject: string;
  projectName: string;
  projectSlug: string;
  headless: boolean;
  projectDescription: string;
  measurementId: string;
  googleSpreadsheetLink: string;
  tagManagerUrl: string;
  version: string;
  preventNavigationEvents: string[];
  recordings: string[];
  reports: string[];
  specs: string[];
  browser: string[];
  gtm: Gtm;
  application: Application;
  authentication: Authentication;
}

// TODO: duplicate schema between settings and project
