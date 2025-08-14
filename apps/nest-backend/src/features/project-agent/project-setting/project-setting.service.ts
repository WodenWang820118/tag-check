import { Injectable } from '@nestjs/common';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import {
  ApplicationSetting,
  ApplicationSettingSchema,
  AuthenticationSchema,
  AuthenticationSetting,
  BrowserSetting,
  BrowserSettingSchema,
  CookieData,
  LocalStorageData,
  ProjectSetting
} from '@utils';

// DEPRECATED
@Injectable()
export class ProjectSettingService {
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService
  ) {}

  async getProjectSettings(projectSlug: string) {
    const content = this.fileService.readJsonFile(
      await this.filePathService.getProjectSettingFilePath(projectSlug)
    );

    return {
      projectSlug,
      settings: content
    };
  }

  async updateSettings(
    projectSlug: string,
    updateFn: (currentSettings: ProjectSetting) => ProjectSetting
  ) {
    const filePath =
      await this.filePathService.getProjectSettingFilePath(projectSlug);
    const currentSettings: ProjectSetting =
      this.fileService.readJsonFile(filePath);
    const updatedSettings = updateFn(currentSettings);
    this.fileService.writeJsonFile(filePath, updatedSettings);
    return updatedSettings;
  }

  async updateProjectSettings(
    projectSlug: string,
    section: string,
    partialSettings:
      | Partial<AuthenticationSchema>
      | ApplicationSettingSchema
      | Partial<BrowserSettingSchema>
  ) {
    switch (section) {
      case 'application':
        return this.updateApplicationSettings(
          projectSlug,
          partialSettings as ApplicationSettingSchema
        );
      case 'browser':
        return this.updateBrowserSettings(projectSlug, partialSettings);
      case 'gtm':
        return this.updateGtmSettings(projectSlug, partialSettings);
      case 'authentication':
        return this.updateAuthenticationSettings(projectSlug, partialSettings);
      case 'others':
        return this.updateGeneralSettings(projectSlug, partialSettings);
      default:
        return;
    }
  }

  async updateAuthenticationSettings(
    projectSlug: string,
    settings: Partial<AuthenticationSchema>
  ) {
    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      authentication: {
        username:
          settings.username || currentSettings.authenticationSettings.username,
        password:
          settings.password || currentSettings.authenticationSettings.password
      }
    }));
  }

  // Shared merge strategy for GTM and general settings
  private mergeSettings(
    projectSlug: string,
    settings: Partial<ProjectSetting>
  ) {
    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      ...settings
    }));
  }

  async updateGtmSettings(
    projectSlug: string,
    settings: Partial<
      AuthenticationSchema | ApplicationSettingSchema | BrowserSettingSchema
    >
  ) {
    return this.mergeSettings(projectSlug, settings as Partial<ProjectSetting>);
  }

  async updateGeneralSettings(
    projectSlug: string,
    settings: Partial<
      AuthenticationSetting | ApplicationSetting | BrowserSetting
    >
  ) {
    return this.mergeSettings(projectSlug, settings as Partial<ProjectSetting>);
  }

  async updateBrowserSettings(
    projectSlug: string,
    rawSettings: Partial<BrowserSettingSchema>
  ) {
    const settingBox = rawSettings;

    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      headless: Boolean(settingBox.headless),
      browser: settingBox.browser || []
    }));
  }

  async updateApplicationSettings(
    projectSlug: string,
    settings: ApplicationSetting
  ) {
    // Helper function for safe parsing
    const safeJsonParse = (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return original value if parsing fails
      }
    };

    // Safely parse localStorage data
    const localStorageData = settings.localStorage.data.map(
      (item: LocalStorageData) => ({
        key: item.key,
        value: safeJsonParse(item.value)
      })
    );

    // Safely parse cookie data
    const cookieData = settings.cookie.data.map((item: CookieData) => ({
      key: item.key,
      value: safeJsonParse(item.value)
    }));

    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      application: {
        localStorage: { data: localStorageData as LocalStorageData[] },
        cookie: { data: cookieData as CookieData[] }
      }
    }));
  }

  async createProjectSettings(projectSlug: string, settings: ProjectSetting) {
    const filePath =
      await this.filePathService.getProjectSettingFilePath(projectSlug);
    this.fileService.writeJsonFile(filePath, settings);
    return settings;
  }
}
