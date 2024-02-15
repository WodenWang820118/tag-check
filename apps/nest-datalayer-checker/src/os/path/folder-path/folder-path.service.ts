import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { ConfigurationService } from '../../../configuration/configuration.service';
import {
  configFolder,
  recordingFolder,
  resultFolder,
} from '../../../configs/project.config';
import path from 'path';
import { FilePathOptions } from '../../../interfaces/filePathOptions.interface';

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
      const folder = path.join(dbRootProjectPath, projectName, resultFolder);
      Logger.log(
        'report saving folder ',
        folder,
        'FolderPathService.getReportSavingFolder'
      );
      return folder;
    } catch (error) {
      Logger.error(error.message, 'FolderService.getReportSavingFolder');
      throw new HttpException(error.messege, 500);
    }
  }

  async getOperationJsonPathByProject(options: FilePathOptions) {
    try {
      const dirPath =
        options.absolutePath ||
        (await this.pathUtilsService.buildFilePath(
          options.name,
          recordingFolder
        ));
      return dirPath;
    } catch (error) {
      Logger.error(
        error.message,
        'FolderPathService.getOperationJsonPathByProject'
      );
    }
  }

  async getProjectFolderPath(projectName: string) {
    try {
      const rootProjectPath =
        await this.configurationService.getRootProjectPath();
      return path.join(rootProjectPath, projectName);
    } catch (error) {
      Logger.error(error.message, 'PathService.getProjectPaht');
      throw new HttpException(error.message, 500);
    }
  }

  async getRecordingFolderPath(projectName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const filePath2 = path.join(
        dbRootProjectPath,
        projectName,
        recordingFolder
      );
      return filePath2;
    } catch (error) {
      Logger.error(error, 'FolderPathService.getRecordingFolderPath');
      throw new HttpException(error, 500);
    }
  }

  async getProjectConfigFolderPath(projectName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectName,
        configFolder,
        ''
      );
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getProjectConfigPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionResultFolderPath(projectName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectName,
        resultFolder
      );
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getInspectionResultPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionEventFolderPath(projectName: string, testName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectName,
        resultFolder,
        testName
      );
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getInspectionTestPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getRecordingFilePath(projectSlug: string, testName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        recordingFolder,
        testName
      );
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getRecordingFilePath');
      throw new HttpException(error.message, 500);
    }
  }
}
