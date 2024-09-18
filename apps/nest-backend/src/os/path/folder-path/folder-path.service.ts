import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { join } from 'path';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { ConfigsService } from '../../../configs/configs.service';

@Injectable()
export class FolderPathService {
  constructor(
    private pathUtilsService: PathUtilsService,
    private configurationService: ConfigurationService,
    private configsService: ConfigsService
  ) {}

  async getRootProjectFolderPath() {
    try {
      return await this.configurationService.getRootProjectPath();
    } catch (error) {
      Logger.error(
        error,
        `${FolderPathService.name}.${FolderPathService.prototype.getRootProjectFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getReportSavingFolderPath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(
        projectSlug,
        this.configsService.getRESULT_FOLDER()
      );
    } catch (error) {
      Logger.error(
        error,
        `${FolderPathService.name}.${FolderPathService.prototype.getReportSavingFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectFolderPath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(projectSlug, '');
    } catch (error) {
      Logger.error(
        error,
        `${FolderPathService.name}.${FolderPathService.prototype.getProjectFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRecordingFolderPath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(
        projectSlug,
        this.configsService.getRECORDING_FOLDER()
      );
    } catch (error) {
      Logger.error(
        error,
        `${FolderPathService.name}.${FolderPathService.prototype.getRecordingFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectConfigFolderPath(projectSlug: string) {
    try {
      const folderPath = await this.pathUtilsService.buildFolderPath(
        projectSlug,
        this.configsService.getCONFIG_FOLDER()
      );
      return folderPath;
    } catch (error) {
      Logger.error(
        error,
        `${FolderPathService.name}.${FolderPathService.prototype.getProjectConfigFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getInspectionEventFolderPath(projectSlug: string, eventId: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(
        projectSlug,
        join(this.configsService.getRESULT_FOLDER(), eventId)
      );
    } catch (error) {
      Logger.error(
        error,
        `${FolderPathService.name}.${FolderPathService.prototype.getInspectionEventFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
