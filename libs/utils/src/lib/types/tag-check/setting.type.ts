import { Auditable } from './auditable.type';
import { ProjectInfo } from './project.type';

export type ProjectSetting = {
  projectSlug: string;
  settings: Setting;
};

export type Setting = {
  gtm: Gtm;
  preventNavigationEvents: string[];
  application: Application;
  browser: string[];
  headless: boolean;
  authentication: Authentication;
} & ProjectInfo;

export type EnvironmentSetting = {
  gtm: Gtm;
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

export type AuthenticationSchema = {
  id: number;
} & Authentication &
  Auditable;

export type BroswerSetting = {
  browser?: string[];
  headless: boolean;
};

export type BrowserSettingSchema = {
  id: number;
} & BroswerSetting &
  Auditable;

export type ApplicationSetting = {
  localStorage?: LocalStorage;
  cookie?: Cookie;
  gtm?: Gtm;
  preventNavigationEvents?: string[];
  authentication?: Authentication;
};

export type ApplicationSettingSchema = {
  id: number;
} & ApplicationSetting;
