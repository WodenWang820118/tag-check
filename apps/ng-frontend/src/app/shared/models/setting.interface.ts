export interface ProjectSetting {
  projectSlug: string;
  settings: Setting;
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
  browser: string[];
}

export interface Application {
  localStorage: LocalStorage;
  cookie: Cookie;
}

export interface LocalStorage {
  data: LocalStorageData[];
}

export interface Cookie {
  data: CookieData[];
}

export interface LocalStorageData {
  key: string;
  value: string;
}

export interface CookieData {
  key: string;
  value: string;
}
