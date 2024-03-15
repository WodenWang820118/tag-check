import { Gtm } from './setting.interface';

export interface Project {
  rootProject: string;
  projectName: string;
  projectSlug: string;
  testType: string;
  headless: boolean;
  projectDescription: string;
  googleSpreadsheetLink: string;
  tagManagerUrl: string;
  version: string;
  preventNavigationEvents: string[];
  recordings: string[];
  reports: string[];
  specs: string[];
  browser: string[];
  gtm: Gtm;
  application: {
    localStorage: {
      data: { key: string; value: string }[];
    };
    cookie: {
      data: { key: string; value: string }[];
    };
  };
}

// TODO: duplicate schema between settings and project
