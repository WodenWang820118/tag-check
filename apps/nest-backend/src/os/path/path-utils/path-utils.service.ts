import { HttpException, Injectable, Logger } from '@nestjs/common';
import path from 'path';
import { ConfigurationService } from '../../../configuration/configuration.service';

@Injectable()
export class PathUtilsService {
  constructor(private configurationService: ConfigurationService) {}

  async buildFilePath(
    projectName: string,
    folderName: string,
    fileName?: string
  ) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();

      const outputPath = path.join(
        dbRootProjectPath,
        projectName,
        folderName,
        fileName || ''
      );
      Logger.log('file path ', outputPath, 'PathUtilsService.buildFilePath');

      return outputPath;
    } catch (error) {
      Logger.error(error, 'PathUtilsService.buildFilePath');
      throw new HttpException(error.message, 500);
    }
  }

  async getRootProjectFolderPath() {
    try {
      return await this.configurationService.getRootProjectPath();
    } catch (error) {
      Logger.error(error.message, 'PathUtilsService.getRootProjectPath');
      throw new HttpException(error.message, 500);
    }
  }
}
