import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { Log } from '../../../logging-interceptor/logging-interceptor.service';

@Injectable()
export class PathUtilsService {
  constructor(private configurationService: ConfigurationService) {}

  @Log()
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

      return outputPath;
    } catch (error) {
      Logger.error(
        error,
        `${PathUtilsService.name}.${PathUtilsService.prototype.buildFilePath.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Log()
  async buildFolderPath(projectSlug: string, folderName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();

      const outputPath = join(dbRootProjectPath, projectSlug, folderName);

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
