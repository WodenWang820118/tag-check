export type ProjectSetting = {
  projectSlug: string;
  settings: Setting;
};

export type Setting = {
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
};

export type Authentication = {
  username: string;
  password: string;
};

export type Gtm = {
  isAccompanyMode: boolean;
  isRequestCheck: boolean;
  tagManagerUrl: string;
  gtmPreviewModeUrl: string;
};

export type Application = {
  localStorage: LocalStorage;
  cookie: Cookie;
};

export type LocalStorage = {
  data: LocalStorageData[];
};

export type Cookie = {
  data: CookieData[];
};

export type LocalStorageData = {
  key: string;
  value: string;
};

export type CookieData = {
  key: string;
  value: string;
};
