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
import { extractEventNameFromId } from '@utils';

@Injectable()
export class ImageService {
  constructor(private folderPathService: FolderPathService) {}

  async readImage(projectSlug: string, eventId: string) {
    try {
      const imageSavingFolder =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventId
        );

      const fileName = extractEventNameFromId(eventId);
      const imagePath = join(imageSavingFolder, `${fileName}.png`);

      if (!existsSync(imagePath)) {
        Logger.error(
          `File not found: ${imagePath}`,
          `${ImageService.name}.${ImageService.prototype.readImage.name}`
        );
        throw new HttpException(
          `File not found: ${imagePath}`,
          HttpStatus.NOT_FOUND
        );
      }

      Logger.log(
        imagePath,
        `${ImageService.name}.${ImageService.prototype.readImage.name}`
      );
      return new StreamableFile(createReadStream(imagePath));
    } catch (error) {
      if (error instanceof HttpException) {
        Logger.error(
          error,
          `${ImageService.name}.${ImageService.prototype.readImage.name}`
        );
        throw error;
      }

      Logger.error(
        error,
        `${ImageService.name}.${ImageService.prototype.readImage.name}`
      );
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
