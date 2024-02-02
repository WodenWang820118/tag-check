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
  dataLayerRecordings: {
    name: string;
    path: string;
  }[];
  dataLayerInspectionResults: string[];
}
