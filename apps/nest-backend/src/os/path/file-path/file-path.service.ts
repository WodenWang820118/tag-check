import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { join } from 'path';
import { extractEventNameFromId } from '@utils';
import { ConfigsService } from '../../../configs/configs.service';

@Injectable()
export class FilePathService {
  constructor(
    private pathUtilsService: PathUtilsService,
    private folderPathService: FolderPathService,
    private configsService: ConfigsService
  ) {}

  async getOperationFilePath(projectSlug: string, eventId: string) {
    try {
      const filePath = await this.pathUtilsService.buildFilePath(
        projectSlug,
        this.configsService.getRECORDING_FOLDER(),
        `${eventId}.json`
      );
      return filePath;
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getOperationFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectConfigFilePath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        this.configsService.getCONFIG_FOLDER(),
        this.configsService.getSPECS()
      );
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getProjectConfigFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectSettingFilePath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        '',
        this.configsService.getSETTINGS()
      );
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getProjectSettingFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectMetaDataFilePath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFilePath(
        projectSlug,
        '',
        this.configsService.getMETA_DATA()
      );
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getProjectMetaDataFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getReportFilePath(
    projectSlug: string,
    eventId: string,
    reportName: string
  ) {
    try {
      const reportSavingFolder =
        await this.folderPathService.getReportSavingFolderPath(projectSlug);
      return join(reportSavingFolder, eventId, `${reportName}`);
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getReportFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCacheFilePath(projectSlug: string, eventId: string) {
    try {
      return join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        eventId,
        `${extractEventNameFromId(eventId)} - result cache.json`
      );
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getCacheFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getImageFilePath(projectSlug: string, eventId: string) {
    try {
      const imageSavingFolder = join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        eventId
      );
      return join(imageSavingFolder, `${extractEventNameFromId(eventId)}.png`);
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getImageFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getInspectionResultFilePath(projectSlug: string, eventId: string) {
    try {
      return join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        eventId,
        this.configsService.getABSTRACT_REPORT_FILE_NAME()
      );
    } catch (error) {
      Logger.error(
        error,
        `${FilePathService.name}.${FilePathService.prototype.getInspectionResultFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRecordingFilePath(projectSlug: string, eventId: string) {
    const recordingPath = await this.pathUtilsService.buildFilePath(
      projectSlug,
      this.configsService.getRECORDING_FOLDER(),
      eventId
    );

    return recordingPath;
  }

  async getMyDataLayerFilePath(projectSlug: string, eventId: string) {
    const resultFolder = await this.folderPathService.getReportSavingFolderPath(
      projectSlug
    );

    const eventName = extractEventNameFromId(eventId);
    const myDataLayerFile = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );

    return myDataLayerFile;
  }
}
