import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { Readable } from 'stream';

import { RECORDING_FILES, RecordingFile } from '../../../shared';

/** Streams a test's latest screen recording, or an empty file when it has none. */
@Injectable()
export class ProjectVideoService {
  constructor(private readonly folderPathService: FolderPathService) {}

  async getVideos(
    projectSlug: string,
    eventId: string,
    file: RecordingFile = RECORDING_FILES.site
  ) {
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );
    const videoPath = join(folder, file);

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
