import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import {
  SPECS,
  CONFIG_FOLDER,
  RECORDING_FOLDER,
  SETTINGS,
  META_DATA,
} from '../../../configs/project.config';
import path from 'path';
import { extractEventNameFromId } from '@utils';
import { existsSync } from 'fs';
// TODO: if it is needed to catch the path not found error or let it be thrown in the upper level?
@Injectable()
export class FilePathService {
  constructor(
    private pathUtilsService: PathUtilsService,
    private folderPathService: FolderPathService
  ) {}

  async getOperationFilePath(projectSlug: string, eventId: string) {
    try {
      const filePath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        RECORDING_FOLDER,
        `${eventId}.json`
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

  async getProjectMetaDataFilePath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        '',
        META_DATA
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

  async getCacheFilePath(projectSlug: string, eventId: string) {
    try {
      return path.join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        eventId,
        `${extractEventNameFromId(eventId)} - result cache.json`
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getCacheFilePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getImageFilePath(projectSlug: string, eventId: string) {
    try {
      const imageSavingFolder = path.join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        eventId
      );
      return path.join(
        imageSavingFolder,
        `${extractEventNameFromId(eventId)}.png`
      );
    } catch (error) {
      Logger.error(error.message, 'FilePathService.getImagePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionResultFilePath(
    projectSlug: string,
    eventId: string,
    fileName: string
  ) {
    try {
      return path.join(
        await this.folderPathService.getInspectionResultFolderPath(projectSlug),
        eventId,
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

  async getRecordingFilePath(projectSlug: string, eventId: string) {
    const recordingPath = await this.pathUtilsService.buildFilePath(
      projectSlug,
      RECORDING_FOLDER,
      eventId
    );

    return recordingPath;
  }

  async getMyDataLayerFilePath(projectSlug: string, eventId: string) {
    const resultFolder = await this.folderPathService.getReportSavingFolderPath(
      projectSlug
    );

    const eventName = extractEventNameFromId(eventId);
    const myDataLayerFile = path.join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );

    if (!existsSync(myDataLayerFile)) {
      throw new HttpException(
        'My data layer file does not exist',
        HttpStatus.NOT_FOUND
      );
    }

    return myDataLayerFile;
  }
}
