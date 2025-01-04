import {
  Application,
  CookieData,
  EventInspectionPreset,
  LocalStorageData,
  ProjectSetting
} from '../types/tag-check';

export class LocalStorageDto {
  data: LocalStorageData[];

  constructor(localStorage: LocalStorageData[]) {
    this.data = [...localStorage];
  }
}

// Create a new DTO for cookie
export class CookieDto {
  data: CookieData[];

  constructor(cookie: CookieData[]) {
    this.data = [...cookie];
  }
}

export class ApplicationDto {
  localStorage: LocalStorageDto;
  cookie: CookieDto;

  constructor(application: Application) {
    this.localStorage = {
      data: [...application.localStorage.data]
    };
    this.cookie = {
      data: [...application.cookie.data]
    };
  }
}

export class EventInspectionPresetDto implements EventInspectionPreset {
  application: Application;
  puppeteerArgs: string[];

  constructor(project: ProjectSetting) {
    this.application = {
      localStorage: {
        data: [...project.settings.application.localStorage.data]
      },
      cookie: {
        data: [...project.settings.application.cookie.data]
      }
    };
    this.puppeteerArgs = [...project.settings.browser];
  }
}
