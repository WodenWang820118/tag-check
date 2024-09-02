import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FolderService } from '../../os/folder/folder.service';
import { FileService } from '../../os/file/file.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { ProjectInfoDto } from '../../dto/project-info.dto';
import { SettingDto } from '../../dto/setting.dto';

@Injectable()
export class ProjectInitializationService {
  constructor(
    private folderService: FolderService,
    private fileService: FileService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  async initProject(projectSlug: string, settings: Partial<ProjectInfoDto>) {
    try {
      const rootProjectPath =
        await this.folderPathService.getRootProjectFolderPath();
      const projectRoot = await this.folderPathService.getProjectFolderPath(
        projectSlug
      );
      this.folderService.createFolder(projectRoot);
      this.folderService.createFolder(
        await this.folderPathService.getRecordingFolderPath(projectSlug)
      );
      this.folderService.createFolder(
        await this.folderPathService.getReportSavingFolderPath(projectSlug)
      );
      this.folderService.createFolder(
        await this.folderPathService.getProjectConfigFolderPath(projectSlug)
      );

      const projectMetaData: ProjectInfoDto = {
        version: '1.0.0',
        rootProject: `${rootProjectPath}`,
        projectName: `${settings.projectName}`,
        projectDescription: `${settings.projectDescription}` || '',
        projectSlug: `${settings.projectSlug}`,
        measurementId: `${settings.measurementId}` || '',
        googleSpreadsheetLink: `${settings.googleSpreadsheetLink}` || '',
      };

      const projectSettings: SettingDto = {
        ...projectMetaData,
        headless: false,
        gtm: {
          isAccompanyMode: false,
          isRequestCheck: false,
          tagManagerUrl: '',
          gtmPreviewModeUrl: '',
        },
        preventNavigationEvents: [],
        authentication: {
          username: '',
          password: '',
        },
        application: {
          localStorage: {
            data: [],
          },
          cookie: {
            data: [],
          },
        },
        browser: [],
      };

      // settings file for complex settings
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectSlug);

      // metadata file for project brief information
      const projectMetadataPath =
        await this.filePathService.getProjectMetaDataFilePath(projectSlug);

      // config file for project specs
      const configFilePath =
        await this.filePathService.getProjectConfigFilePath(projectSlug);

      this.fileService.writeJsonFile(projectMetadataPath, projectMetaData);
      this.fileService.writeJsonFile(configFilePath, []);
      this.fileService.writeJsonFile(settingsFilePath, projectSettings);
    } catch (error) {
      Logger.error(
        error,
        `${ProjectInitializationService.name}.${ProjectInitializationService.prototype.initProject.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initInspectionEventSavingFolder(projectName: string, eventId: string) {
    const eventFolder =
      await this.folderPathService.getInspectionEventFolderPath(
        projectName,
        eventId
      );
    this.folderService.createFolder(eventFolder);
  }
}
