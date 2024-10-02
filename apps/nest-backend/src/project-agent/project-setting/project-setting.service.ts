/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { CookieData, LocalStorageData, Setting } from '@utils';

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
      settings: content,
    };
  }

  async updateSettings(
    projectSlug: string,
    updateFn: (currentSettings: Setting) => Setting
  ) {
    const filePath = await this.filePathService.getProjectSettingFilePath(
      projectSlug
    );
    const currentSettings: Setting = this.fileService.readJsonFile(filePath);
    const updatedSettings = updateFn(currentSettings);
    this.fileService.writeJsonFile(filePath, updatedSettings);
    return updatedSettings;
  }

  async updateProjectSettings(
    projectSlug: string,
    section: string,
    partialSettings: Partial<Setting>
  ) {
    switch (section) {
      case 'application':
        return this.updateApplicationSettings(projectSlug, partialSettings);
      case 'browser':
        return this.updateBrowserSettings(projectSlug, partialSettings);
      case 'gtm':
        return this.updateGtmSettings(projectSlug, partialSettings);
      case 'preventNavigationEvents':
        return this.updatePreventNavigationEvents(projectSlug, partialSettings);
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
    settings: Partial<Setting>
  ) {
    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      authentication: {
        username:
          settings.authentication?.username ||
          currentSettings.authentication.username,
        password:
          settings.authentication?.password ||
          currentSettings.authentication.password,
      },
    }));
  }

  async updatePreventNavigationEvents(
    projectSlug: string,
    partialSettings: Partial<Setting>
  ) {
    return this.updateSettings(projectSlug, (currentSettings) => {
      const preventNavigationEvents = currentSettings.preventNavigationEvents;
      const newEvents = partialSettings.preventNavigationEvents;

      if (!newEvents) {
        return currentSettings;
      }

      // Create a copy of the current preventNavigationEvents to modify
      let newSettings: string[] = [...preventNavigationEvents];

      for (const receivedEvent of newEvents) {
        const index = newSettings.indexOf(receivedEvent);

        if (index > -1) {
          // Event is found, remove it (toggle behavior)
          newSettings.splice(index, 1);
        } else {
          // Event is new, add it to the array
          newSettings.push(receivedEvent);
        }
      }

      // If original array was empty, just return the new events
      if (!preventNavigationEvents.length) {
        newSettings = [...newEvents];
      }

      return {
        ...currentSettings,
        preventNavigationEvents: newSettings,
      };
    });
  }

  async updateGtmSettings(projectSlug: string, settings: Partial<Setting>) {
    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      ...settings,
    }));
  }

  async updateGeneralSettings(projectSlug: string, settings: Partial<Setting>) {
    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      ...settings,
    }));
  }

  async updateBrowserSettings(
    projectSlug: string,
    rawSettings: Partial<Setting>
  ) {
    const settingBox = rawSettings;

    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      headless: Boolean(settingBox.headless),
      browser: settingBox.browser || [],
    }));
  }

  async updateApplicationSettings(
    projectSlug: string,
    settings: Partial<Setting>
  ) {
    const localStorageData = settings?.application?.localStorage.data.map(
      (item: LocalStorageData) => ({
        key: item.key,
        value: JSON.parse(item.value),
      })
    );
    const cookieData = settings?.application?.cookie.data.map(
      (item: CookieData) => ({
        key: item.key,
        value: JSON.parse(item.value),
      })
    );
    return this.updateSettings(projectSlug, (currentSettings) => ({
      ...currentSettings,
      application: {
        localStorage: { data: localStorageData as LocalStorageData[] },
        cookie: { data: cookieData as CookieData[] },
      },
    }));
  }

  async createProjectSettings(projectSlug: string, settings: Setting) {
    const filePath = await this.filePathService.getProjectSettingFilePath(
      projectSlug
    );
    this.fileService.writeJsonFile(filePath, settings);
    return settings;
  }
}
