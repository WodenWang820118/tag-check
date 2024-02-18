import { Injectable, Logger, HttpException } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import {
  SPECS,
  CONFIG_FOLDER,
  RECORDING_FOLDER,
  SETTINGS,
} from '../../../configs/project.config';
import path from 'path';

@Injectable()
export class FilePathService {
  constructor(
    private pathUtilsService: PathUtilsService,
    private folderPathService: FolderPathService
  ) {}

  async getOperationFilePath(projectSlug: string, testName: string) {
    try {
      const filePath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        RECORDING_FOLDER,
        `${testName}.json`
      );
      return filePath;
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getOperationPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectConfigFilePath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        CONFIG_FOLDER,
        SPECS
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getProjectConfigPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectSettingFilePath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        '',
        SETTINGS
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getProjectSettingPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getReportFilePath(projectSlug: string, reportName: string) {
    try {
      const reportSavingFolder =
        await this.folderPathService.getReportSavingFolderPath(projectSlug);
      return path.join(reportSavingFolder, `${reportName}`);
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getReportFilePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getCacheFilePath(projectSlug: string, operation: string) {
    try {
      return path.join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        operation.replace('.json', ''),
        `${operation.replace('.json', '')} - result cache.json`
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getCacheFilePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getImageFilePath(projectSlug: string, testName: string) {
    try {
      const imageSavingFolder = path.join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        testName
      );
      return path.join(imageSavingFolder, `${testName}.png`);
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getImagePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionResultFilePath(
    projectSlug: string,
    testName: string,
    fileName: string
  ) {
    try {
      return path.join(
        await this.folderPathService.getInspectionResultFolderPath(projectSlug),
        testName,
        fileName
      );
    } catch (error) {
      Logger.error(
        error.message,
        'FilePathService.getInspectionResultFilePath'
      );
      throw new HttpException(error.message, 500);
    }
  }

  async getRecordingFilePath(projectSlug: string, testName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        RECORDING_FOLDER,
        testName
      );
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getRecordingFilePath');
      throw new HttpException(error.message, 500);
    }
  }
}
