import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import path from 'path';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { FilePathOptions } from '../../../interfaces/filePathOptions.interface';

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

      const filePath2 = path.join(
        dbRootProjectPath,
        projectName,
        folderName,
        fileName || ''
      );
      Logger.log('file path ', filePath2, 'FileService.buildFilePath');

      return filePath2;
    } catch (error) {
      Logger.error(error, 'FileService.buildFilePath');
      throw new HttpException(error.message, 500);
    }
  }

  validateInput(projectName: string, options: FilePathOptions): void {
    if (!projectName || !options) {
      throw new BadRequestException('Project name or options cannot be empty');
    }
  }
}
