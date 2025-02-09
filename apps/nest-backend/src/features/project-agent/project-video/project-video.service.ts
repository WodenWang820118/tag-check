import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { Readable } from 'stream';

@Injectable()
export class ProjectVideoService {
  constructor(private folderPathService: FolderPathService) {}

  async getVideos(projectSlug: string, eventId: string) {
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );
    const videoPath = join(folder, 'recording.webm');

    Logger.debug(`Video path: ${videoPath}`, ProjectVideoService.name);

    if (!existsSync(videoPath)) {
      const readable = new Readable();
      readable.push(null);
      return new StreamableFile(readable);
    }

    const videoStream = createReadStream(videoPath);
    return new StreamableFile(videoStream);
  }
}
