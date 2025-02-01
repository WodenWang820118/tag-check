import { Injectable, StreamableFile } from '@nestjs/common';
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
    if (existsSync(videoPath) === false) {
      // Return an empty response with a custom header
      // Create empty buffer with appropriate options
      const emptyStream = new Readable();
      emptyStream.push(null);
      return {
        streamableFile: new StreamableFile(emptyStream, {
          type: 'video/webm',
          disposition: 'inline'
        }),
        hasVideo: false
      };
    }
    const videoStream = createReadStream(videoPath);
    return {
      streamableFile: new StreamableFile(videoStream, {
        type: 'video/webm',
        disposition: 'inline'
      }),
      hasVideo: true
    };
  }
}
