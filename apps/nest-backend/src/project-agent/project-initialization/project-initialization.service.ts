import { Injectable } from '@nestjs/common';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { ProjectInfoDto } from '../../dto/project-info.dto';
import { SettingDto } from '../../dto/setting.dto';

@Injectable()
export class ProjectInitializationService {
  constructor(
    private readonly folderService: FolderService,
    private readonly fileService: FileService,
    private readonly folderPathService: FolderPathService,
    private readonly filePathService: FilePathService
  ) {}

  async initProject(projectSlug: string, settings: Partial<ProjectInfoDto>) {
    await this.createProjectFolders(projectSlug);
    const projectMetaData: ProjectInfoDto =
      await this.createProjectMetaData(settings);
    const projectSettings: SettingDto =
      this.createProjectSettings(projectMetaData);
    await this.writeProjectFiles(projectSlug, projectMetaData, projectSettings);
  }

  private async createProjectFolders(projectSlug: string) {
    const projectRoot =
      await this.folderPathService.getProjectFolderPath(projectSlug);
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
  }

  private async createProjectMetaData(
    settings: Partial<ProjectInfoDto>
  ): Promise<ProjectInfoDto> {
    const rootProjectPath =
      await this.folderPathService.getRootProjectFolderPath();
    return {
      version: '1.0.0',
      rootProject: rootProjectPath,
      projectName: settings.projectName || '',
      projectDescription: settings.projectDescription || '',
      projectSlug: settings.projectSlug || '',
      measurementId: settings.measurementId || '',
      googleSpreadsheetLink: settings.googleSpreadsheetLink || ''
    };
  }

  private createProjectSettings(projectMetaData: ProjectInfoDto): SettingDto {
    return {
      ...projectMetaData,
      headless: false,
      gtm: {
        isAccompanyMode: false,
        isRequestCheck: false,
        tagManagerUrl: '',
        gtmPreviewModeUrl: ''
      },
      preventNavigationEvents: [],
      authentication: {
        username: '',
        password: ''
      },
      application: {
        localStorage: {
          data: []
        },
        cookie: {
          data: []
        }
      },
      browser: []
    };
  }

  private async writeProjectFiles(
    projectSlug: string,
    metadata: ProjectInfoDto,
    settings: SettingDto
  ) {
    const settingsFilePath =
      await this.filePathService.getProjectSettingFilePath(projectSlug);
    const projectMetadataPath =
      await this.filePathService.getProjectMetaDataFilePath(projectSlug);
    const configFilePath =
      await this.filePathService.getProjectConfigFilePath(projectSlug);

    this.fileService.writeJsonFile(projectMetadataPath, metadata);
    this.fileService.writeJsonFile(configFilePath, []);
    this.fileService.writeJsonFile(settingsFilePath, settings);
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
