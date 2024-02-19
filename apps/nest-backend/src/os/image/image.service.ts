import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { FolderService } from '../folder/folder.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { existsSync, createReadStream } from 'fs';
import { join } from 'path';

@Injectable()
export class ImageService {
  constructor(
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  async readImage(projectSlug: string, testName: string) {
    try {
      const imageSavingFolder = join(
        await this.folderPathService.getReportSavingFolderPath(projectSlug),
        testName
      );
      const imagePath = join(imageSavingFolder, `${testName}.png`);

      if (!existsSync(imagePath)) {
        throw new Error(`File not found: ${imagePath}`);
      }

      Logger.log(imagePath, 'SharedService.readImage');
      return new StreamableFile(createReadStream(imagePath));
    } catch (error) {
      Logger.error(error.message, 'FileService.readImage');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
