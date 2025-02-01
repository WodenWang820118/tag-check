import { Auditable } from './auditable.type';
import { Project } from './project.type';

export type ProjectSetting = {
  authenticationSettings: AuthenticationSetting;
  browserSettings: BrowserSetting;
  applicationSettings: ApplicationSetting;
} & Project;

export type AuthenticationSetting = {
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
} & AuthenticationSetting &
  Auditable;

export type BrowserSetting = {
  browser: string[];
  headless: boolean;
};

export type BrowserSettingSchema = {
  id: number;
} & BrowserSetting &
  Auditable;

export type ApplicationSetting = {
  localStorage: LocalStorage;
  cookie: Cookie;
  gtm: Gtm;
};

export type ApplicationSettingSchema = {
  id: number;
} & ApplicationSetting;
