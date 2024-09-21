/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Injectable()
export class ProjectService {
  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  @Log()
  async getProjectSettings(projectSlug: string) {
    try {
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectSlug);
      return this.fileService.readJsonFile(settingsFilePath);
    } catch (error) {
      Logger.error(
        error,
        `${ProjectService.name}.${ProjectService.prototype.getProjectSettings.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Log()
  async getProjectsMetadata() {
    try {
      const projectRoot =
        await this.folderPathService.getRootProjectFolderPath();
      const projects = this.folderService
        .readFolderFiles(projectRoot)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // Map each project to a promise of its settings
      const projectSettingsPromises = projects.map(async (project) => {
        return this.getProjectMetadata(project);
      });

      // Resolve all promises before returning
      const projectsAll = await Promise.all(projectSettingsPromises);

      return projectsAll || [];
    } catch (error) {
      Logger.error(
        error,
        `${ProjectService.name}.${ProjectService.prototype.getProjectsMetadata.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
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

      const project = projectNames.find(
        (name) => name === projectSlug
      ) as string;
      const metaData = await this.fileService.readJsonFile(
        await this.filePathService.getProjectMetaDataFilePath(project)
      );
      return metaData;
    } catch (error) {
      Logger.error(
        error,
        `${ProjectService.name}.${ProjectService.prototype.getProjectMetadata.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
