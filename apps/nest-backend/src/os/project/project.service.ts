import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';

@Injectable()
export class ProjectService {
  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  async getProjectSettings(projectSlug: string) {
    try {
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectSlug);
      return this.fileService.readJsonFile(settingsFilePath);
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjectSettings');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectRecordings(projectSlug: string) {
    try {
      const recordingPath = await this.folderPathService.getRecordingFolderPath(
        projectSlug
      );
      const recordings = this.folderService.readFolderFiles(recordingPath);
      return recordings;
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjectRecordings');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectsMetadata() {
    try {
      const projectRoot =
        await this.folderPathService.getRootProjectFolderPath();
      const projects = this.folderService
        .readFolderFiles(projectRoot)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // Logger.log(projects, 'ProjectService.getProjects');
      // Map each project to a promise of its settings
      const projectSettingsPromises = projects.map(async (project) => {
        return this.getProjectMetadata(project);
      });

      // Resolve all promises before returning
      const projectsAll = await Promise.all(projectSettingsPromises);

      // Logger.log(projectsAll, 'ProjectService.getProjects');
      return projectsAll;
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjects');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectMetadata(projectSlug: string) {
    try {
      const projectRoot =
        await this.folderPathService.getRootProjectFolderPath();
      const projectNames = this.folderService
        .readFolderFiles(projectRoot)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const project = projectNames.find((name) => name === projectSlug);
      const metaData = await this.fileService.readJsonFile(
        await this.filePathService.getProjectMetaDataFilePath(project)
      );
      return metaData;
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProject');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
