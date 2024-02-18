import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { ConfigurationService } from '../../../configuration/configuration.service';
import {
  CONFIG_FOLDER,
  RECORDING_FOLDER,
  RESULT_FOLDER,
} from '../../../configs/project.config';
import path from 'path';

@Injectable()
export class FolderPathService {
  constructor(
    private pathUtilsService: PathUtilsService,
    private configurationService: ConfigurationService
  ) {}

  async getRootProjectFolderPath() {
    try {
      return await this.configurationService.getRootProjectPath();
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getRootProjectPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getReportSavingFolderPath(projectName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const folderPath = path.join(
        dbRootProjectPath,
        projectName,
        RESULT_FOLDER
      );
      return folderPath;
    } catch (error) {
      Logger.error(error.message, 'FolderService.getReportSavingFolder');
      throw new HttpException(error.messege, 500);
    }
  }

  async getOperationJsonPathByProject(projectSlug: string) {
    try {
      const folderPath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        RECORDING_FOLDER
      );
      return folderPath;
    } catch (error) {
      Logger.error(
        error.message,
        'FolderPathService.getOperationJsonPathByProject'
      );
    }
  }

  async getProjectFolderPath(projectSlug: string) {
    try {
      const rootProjectPath =
        await this.configurationService.getRootProjectPath();
      const folderPath = path.join(rootProjectPath, projectSlug);
      return folderPath;
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getProjectFolderPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getRecordingFolderPath(projectName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();

      const folderPath = path.join(
        dbRootProjectPath,
        projectName,
        RECORDING_FOLDER
      );
      return folderPath;
    } catch (error) {
      Logger.error(error, 'FolderPathService.getRecordingFolderPath');
      throw new HttpException(error, 500);
    }
  }

  async getProjectConfigFolderPath(projectSlug: string) {
    try {
      const folderPath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        CONFIG_FOLDER
      );
      return folderPath;
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getProjectConfigPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionResultFolderPath(projectSlug: string) {
    try {
      const folderPath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        RESULT_FOLDER
      );
      return folderPath;
    } catch (error) {
      Logger.error(
        error.message,
        'FolderPathService.getInspectionResultFolderPath'
      );
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionEventFolderPath(projectSlug: string, testName: string) {
    try {
      const folderPath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        RESULT_FOLDER,
        testName
      );
      return folderPath;
    } catch (error) {
      Logger.error(
        error.message,
        'FolderPathService.getInspectionEventFolderPath'
      );
      throw new HttpException(error.message, 500);
    }
  }
}
