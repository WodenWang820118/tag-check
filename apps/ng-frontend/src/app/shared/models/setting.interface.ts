export interface ProjectSetting {
  projectSlug: string;
  settings: Setting;
}

export interface Application {
  key: string;
  value: string;
}

interface Setting {
  rootProject: string;
  projectName: string;
  projectDescription: string;
  projectSlug: string;
  testType: string;
  googleSpreadsheetLink: string;
  tagManagerUrl: string;
  gtmId: string;
  containerName: string;
  version: string;
  preventNavigationEvents: string[];
  application: Application;
}
