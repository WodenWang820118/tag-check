import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { existsSync, createReadStream } from 'fs';
import { join } from 'path';

@Injectable()
export class ImageService {
  constructor(private folderPathService: FolderPathService) {}

  async readImage(projectSlug: string, eventId: string) {
    try {
      const imageSavingFolder = join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        eventId
      );
      const imagePath = join(imageSavingFolder, `${eventId}.png`);

      if (!existsSync(imagePath)) {
        Logger.log('File not found', 'SharedService.readImage');
        throw new HttpException(
          `File not found: ${imagePath}`,
          HttpStatus.NOT_FOUND
        );
      }

      Logger.log(imagePath, 'SharedService.readImage');
      return new StreamableFile(createReadStream(imagePath));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(error.message, 'FileService.readImage');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
