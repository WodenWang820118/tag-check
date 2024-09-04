import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { ConfigurationService } from '../../../configuration/configuration.service';

@Injectable()
export class PathUtilsService {
  constructor(private configurationService: ConfigurationService) {}

  async buildFilePath(
    projectName: string,
    folderName: string,
    fileName: string
  ) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();

      const outputPath = join(
        dbRootProjectPath,
        projectName,
        folderName,
        fileName || ''
      );
      Logger.log(
        'file pathL ' + outputPath,
        `${PathUtilsService.name}.${PathUtilsService.prototype.buildFilePath.name}`
      );

      return outputPath;
    } catch (error) {
      Logger.error(
        error,
        `${PathUtilsService.name}.${PathUtilsService.prototype.buildFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async buildFolderPath(projectSlug: string, folderName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();

      const outputPath = join(dbRootProjectPath, projectSlug, folderName);
      Logger.log(
        'folder path: ' + outputPath,
        `${PathUtilsService.name}.${PathUtilsService.prototype.buildFolderPath.name}`
      );

      return outputPath;
    } catch (error) {
      Logger.error(
        error,
        `${PathUtilsService.name}.${PathUtilsService.prototype.buildFolderPath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
