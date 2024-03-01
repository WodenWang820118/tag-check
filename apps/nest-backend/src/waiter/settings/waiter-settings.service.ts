import { Injectable } from '@nestjs/common';
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

  async updateProjectSettings(projectSlug: string, partialSettings: any) {
    const filePath = await this.filePathService.getProjectSettingFilePath(
      projectSlug
    );
    const currentSettings = await this.fileService.readJsonFile(filePath);

    // Merge the existing settings with the new partial settings
    const updatedSettings = { ...currentSettings, ...partialSettings };

    await this.fileService.writeJsonFile(filePath, updatedSettings);
    return updatedSettings;
  }

  async createProjectSettings(projectSlug: string, settings: any) {
    const filePath = await this.filePathService.getProjectSettingFilePath(
      projectSlug
    );
    await this.fileService.writeJsonFile(filePath, settings);
    return settings;
  }
}
