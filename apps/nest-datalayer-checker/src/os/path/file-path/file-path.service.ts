import { Injectable, Logger, HttpException } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { configFolder, recordingFolder } from '../../../configs/project.config';
import path from 'path';
import { FilePathOptions } from '../../../interfaces/filePathOptions.interface';

@Injectable()
export class FilePathService {
  constructor(
    private pathUtilsService: PathUtilsService,
    private folderPathService: FolderPathService
  ) {}

  async getOperationFilePath(projectName: string, options: FilePathOptions) {
    try {
      this.pathUtilsService.validateInput(projectName, options);

      const filePath =
        options.absolutePath ||
        (await this.pathUtilsService.buildFilePath(
          projectName,
          recordingFolder,
          `${options.name}.json`
        ));

      Logger.log(`filePath: ${filePath}`, 'FilePathService.getOperationPath');
      return filePath;
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getOperationPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectConfigFilePath(projectName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectName,
        configFolder,
        'spec.json'
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getProjectConfigPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectSettingFilePath(projectName: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectName,
        '',
        'settings.json'
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getProjectSettingPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getReportFilePath(projectName: string, reportName: string) {
    try {
      const reportSavingFolder =
        await this.folderPathService.getReportSavingFolderPath(projectName);
      return path.join(reportSavingFolder, `${reportName}`);
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getReportPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getCacheFilePath(projectName: string, operation: string) {
    return path.join(
      await this.folderPathService.getReportSavingFolderPath(projectName),
      operation.replace('.json', ''),
      `${operation.replace('.json', '')} - result cache.json`
    );
  }

  async getImageFilePath(projectName: string, testName: string) {
    try {
      const imageSavingFolder = path.join(
        await this.folderPathService.getReportSavingFolderPath(projectName),
        testName
      );
      return path.join(imageSavingFolder, `${testName}.png`);
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getImagePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionResultFilePath(
    projectName: string,
    testName: string,
    fileName: string
  ) {
    return path.join(
      await this.folderPathService.getInspectionResultFolderPath(projectName),
      testName,
      fileName
    );
  }
}
