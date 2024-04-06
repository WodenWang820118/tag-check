export interface ProjectSetting {
  projectSlug: string;
  settings: Setting;
}

export interface Setting {
  rootProject: string;
  projectName: string;
  projectDescription: string;
  measurementId: string;
  projectSlug: string;
  googleSpreadsheetLink: string;
  gtm: Gtm;
  version: string;
  preventNavigationEvents: string[];
  application: Application;
  browser: string[];
  headless: boolean;
  authentication: Authentication;
}

export interface Authentication {
  username: string;
  password: string;
}

export interface Gtm {
  isAccompanyMode: boolean;
  isRequestCheck: boolean;
  tagManagerUrl: string;
  gtmPreviewModeUrl: string;
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
