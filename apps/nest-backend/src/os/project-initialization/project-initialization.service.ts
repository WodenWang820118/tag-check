import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FolderService } from '../folder/folder.service';
import { FileService } from '../file/file.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';

@Injectable()
export class ProjectInitializationService {
  constructor(
    private folderService: FolderService,
    private fileService: FileService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  async initProject(projectName: string, settings: any) {
    try {
      const rootProjectPath =
        await this.folderPathService.getRootProjectFolderPath();
      const projectRoot = await this.folderPathService.getProjectFolderPath(
        projectName
      );
      this.folderService.createFolder(projectRoot);
      this.folderService.createFolder(
        await this.folderPathService.getRecordingFolderPath(projectName)
      );
      this.folderService.createFolder(
        await this.folderPathService.getInspectionResultFolderPath(projectName)
      );
      this.folderService.createFolder(
        await this.folderPathService.getProjectConfigFolderPath(projectName)
      );

      const projectSettings = {
        rootProject: `${rootProjectPath}`,
        projectName: `${projectName}`,
        projectDescription: `${settings.projectDescription}`,
        projectSlug: `${settings.projectSlug}`,
        testType: `${settings.testType}`,
        googleSpreadsheetLink: `${settings.googleSpreadsheetLink}`,
        gtm: {
          isAccompanyMode: false,
          tagManagerUrl: `${settings.tagManagerUrl}`,
          gtmPreviewModeUrl: '',
          gtmId: `${settings.gtmId}`,
        },
        containerName: `${settings.containerName}`,
        preventNavigationEvents: ['select_promotion', 'select_item'],
        version: '1.0.0',
      };

      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectName);
      const configFilePath =
        await this.filePathService.getProjectConfigFilePath(projectName);
      this.setSsettings(settingsFilePath, projectSettings);
      this.setSsettings(configFilePath, []);
    } catch (error) {
      Logger.error(error.message, 'ProjectInitializationService.initProject');
      throw new HttpException(error.message, 500);
    }
  }

  async initInspectionEventSavingFolder(projectName: string, testName: string) {
    const eventFolder =
      await this.folderPathService.getInspectionEventFolderPath(
        projectName,
        testName
      );
    this.folderService.createFolder(eventFolder);
  }

  setSsettings(settingsFilePath: string, settings: any) {
    this.fileService.writeJsonFile(settingsFilePath, settings);
  }
}
