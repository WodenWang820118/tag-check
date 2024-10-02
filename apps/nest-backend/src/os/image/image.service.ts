import {
  Injectable,
  Logger,
  NotFoundException,
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
    const imageSavingFolder =
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      );

    if (!existsSync(imageSavingFolder)) {
      throw new NotFoundException('Folder not found');
    }

    const fileName = extractEventNameFromId(eventId);
    const imagePath = join(imageSavingFolder, `${fileName}.png`);

    if (!existsSync(imagePath)) {
      throw new NotFoundException(`Image File not found: ${imagePath}`);
    }
    return new StreamableFile(createReadStream(imagePath));
  }
}
