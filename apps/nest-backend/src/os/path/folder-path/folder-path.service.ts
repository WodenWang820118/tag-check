import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import {
  CONFIG_FOLDER,
  RECORDING_FOLDER,
  RESULT_FOLDER,
} from '../../../configs/project.config';
import { join } from 'path';
import { ConfigurationService } from '../../../configuration/configuration.service';

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

  async getReportSavingFolderPath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(
        projectSlug,
        RESULT_FOLDER
      );
    } catch (error) {
      Logger.error(error.message, 'FolderService.getReportSavingFolder');
      throw new HttpException(error.messege, 500);
    }
  }

  async getProjectFolderPath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(projectSlug, '');
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getProjectFolderPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getRecordingFolderPath(projectSlug: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(
        projectSlug,
        RECORDING_FOLDER
      );
    } catch (error) {
      Logger.error(error, 'FolderPathService.getRecordingFolderPath');
      throw new HttpException(error, 500);
    }
  }

  async getProjectConfigFolderPath(projectSlug: string) {
    try {
      const folderPath = await this.pathUtilsService.buildFolderPath(
        projectSlug,
        CONFIG_FOLDER
      );
      return folderPath;
    } catch (error) {
      Logger.error(error.message, 'FolderPathService.getProjectConfigPath');
      throw new HttpException(error.message, 500);
    }
  }

  async getInspectionEventFolderPath(projectSlug: string, eventId: string) {
    try {
      return await this.pathUtilsService.buildFolderPath(
        projectSlug,
        join(RESULT_FOLDER, eventId)
      );
    } catch (error) {
      Logger.error(
        error.message,
        'FolderPathService.getInspectionEventFolderPath'
      );
      throw new HttpException(error.message, 500);
    }
  }
}
