import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';

@Injectable()
export class WaiterSettingsService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService
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

  async updateProjectSettings(
    projectSlug: string,
    section: string,
    partialSettings: any
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

  async updateAuthenticationSettings(projectSlug: string, settings: any) {
    try {
      const filePath = await this.filePathService.getProjectSettingFilePath(
        projectSlug
      );

      const currentSettings = await this.fileService.readJsonFile(filePath);

      const updatedSettings = {
        ...currentSettings,
        authentication: {
          ...settings,
        },
      };

      await this.fileService.writeJsonFile(filePath, updatedSettings);
      return updatedSettings;
    } catch (error) {
      Logger.error('Error updating settings', error);
      throw new HttpException('Error updating settings', 500);
    }
  }

  async updatePreventNavigationEvents(
    projectSlug: string,
    partialSettings: any
  ) {
    try {
      const filePath = await this.filePathService.getProjectSettingFilePath(
        projectSlug
      );

      const currentSettings = await this.fileService.readJsonFile(filePath);
      const preventNavigationEvents =
        currentSettings.preventNavigationEvents as string[];
      const newEvents = partialSettings.preventNavigationEvents as string[];

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

      const updatedSettings = {
        ...currentSettings,
        preventNavigationEvents: newSettings,
      };

      await this.fileService.writeJsonFile(filePath, updatedSettings);
      return updatedSettings;
    } catch (error) {
      Logger.error('Error updating settings', error);
      throw new HttpException('Error updating settings', 500);
    }
  }

  async updateGtmSettings(projectSlug: string, settings: any) {
    try {
      const filePath = await this.filePathService.getProjectSettingFilePath(
        projectSlug
      );

      const currentSettings = await this.fileService.readJsonFile(filePath);
      const gtmCurrentSettings = currentSettings.gtm;

      const updatedSettings = {
        ...currentSettings,
        gtm: {
          ...gtmCurrentSettings,
          ...settings,
        },
      };

      await this.fileService.writeJsonFile(filePath, updatedSettings);
      return updatedSettings;
    } catch (error) {
      Logger.error('Error updating settings', error);
      throw new HttpException('Error updating settings', 500);
    }
  }

  async updateGeneralSettings(projectSlug: string, settings: any) {
    try {
      const filePath = await this.filePathService.getProjectSettingFilePath(
        projectSlug
      );

      const currentSettings = await this.fileService.readJsonFile(filePath);

      const updatedSettings = {
        ...currentSettings,
        ...settings,
      };

      await this.fileService.writeJsonFile(filePath, updatedSettings);
      return updatedSettings;
    } catch (error) {
      Logger.error('Error updating settings', error);
      throw new HttpException('Error updating settings', 500);
    }
  }

  async updateBrowserSettings(
    projectSlug: string,
    rawSettings: {
      headless: boolean;
      browser: string[];
    }
  ) {
    const settingBox = rawSettings;

    try {
      const filePath = await this.filePathService.getProjectSettingFilePath(
        projectSlug
      );

      const currentSettings = await this.fileService.readJsonFile(filePath);

      const updatedSettings = {
        ...currentSettings,
        headless: settingBox.headless,
        browser: settingBox.browser,
      };

      await this.fileService.writeJsonFile(filePath, updatedSettings);
      return updatedSettings;
    } catch (error) {
      Logger.error('Error updating settings', error);
      throw new HttpException('Error updating settings', 500);
    }
  }

  async updateApplicationSettings(projectSlug: string, settings: any) {
    try {
      const filePath = await this.filePathService.getProjectSettingFilePath(
        projectSlug
      );

      const currentSettings = await this.fileService.readJsonFile(filePath);
      const localStorage = settings.localStorage.map((item: any) => {
        return {
          key: item.key,
          value: JSON.parse(item.value),
        };
      });

      const cookie = settings.cookie.map((item: any) => {
        return {
          key: item.key,
          value: JSON.parse(item.value),
        };
      });

      const updatedSettings = {
        ...currentSettings,
        application: {
          localStorage: {
            data: localStorage,
          },
          cookie: {
            data: cookie,
          },
        },
      };

      await this.fileService.writeJsonFile(filePath, updatedSettings);
      return updatedSettings;
    } catch (error) {
      Logger.error('Error updating settings', error);
      throw new HttpException('Error updating settings', 500);
    }
  }

  async createProjectSettings(projectSlug: string, settings: any) {
    const filePath = await this.filePathService.getProjectSettingFilePath(
      projectSlug
    );
    await this.fileService.writeJsonFile(filePath, settings);
    return settings;
  }
}
