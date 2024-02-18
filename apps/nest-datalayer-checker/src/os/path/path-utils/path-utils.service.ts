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
      Logger.log('file path ', outputPath, 'FileService.buildFilePath');

      return outputPath;
    } catch (error) {
      Logger.error(error, 'FileService.buildFilePath');
      throw new HttpException(error.message, 500);
    }
  }
}
