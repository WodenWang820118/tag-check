import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';

/**
 * @description
 */
@Injectable()
export class ProjectService {
  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}
  async getSettings(projectName: string) {
    try {
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectName);
      return this.fileService.readJsonFile(settingsFilePath);
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getSettings');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectSettings(projectName: string) {
    try {
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectName);
      return this.fileService.readJsonFile(settingsFilePath);
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjectSettings');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectDataLayerRecordings(projectName: string) {
    try {
      const recordingPath = await this.folderPathService.getRecordingFolderPath(
        projectName
      );
      const recordings = this.folderService.readFolderFiles(recordingPath);
      return recordings;
    } catch (error) {
      Logger.error(
        error.message,
        'ProjectService.getProjectDataLayerRecordings'
      );
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectDataLayerInspectionResults(projectName: string) {
    try {
      const resultFolderPath =
        await this.folderPathService.getInspectionResultFolderPath(projectName);
      const results = this.folderService
        .readFolderFiles(resultFolderPath)
        .filter((dirent) => dirent.isDirectory())
        .map(
          async (dirent) =>
            await this.folderPathService.getInspectionEventFolderPath(
              resultFolderPath,
              dirent.name
            )
        );

      return Promise.all(results);
    } catch (error) {
      Logger.error(
        error.message,
        'ProjectService.getProjectDataLayerInspectionResults'
      );
      throw new HttpException(error.message, 500);
    }
  }

  async getProjects() {
    try {
      const projectRoot =
        await this.folderPathService.getRootProjectFolderPath();
      const projects = this.folderService
        .readFolderFiles(projectRoot)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      Logger.log(projects, 'ProjectService.getProjects');
      // Map each project to a promise of its settings
      const projectSettingsPromises = projects.map(async (project) => {
        // const projectConfig =
        //   await this.filePathService.getProjectConfigFilePath(project);
        const settings = await this.getProjectSettings(project);
        const projectDataLayerRecordings =
          await this.getProjectDataLayerRecordings(project);
        const projectDataLayerInspectionResults =
          await this.getProjectDataLayerInspectionResults(project);
        return {
          projectName: project,
          ...settings,
          dataLayerRecordings: projectDataLayerRecordings,
          dataLayerInspectionResults: projectDataLayerInspectionResults,
        };
      });

      // Resolve all promises before returning
      const projectsAll = await Promise.all(projectSettingsPromises);

      Logger.log(projectsAll, 'ProjectService.getProjects');
      return projectsAll;
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjects');
      throw new HttpException(error.message, 500);
    }
  }
}
