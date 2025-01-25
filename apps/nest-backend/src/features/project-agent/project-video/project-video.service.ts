import { Injectable, StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream } from 'fs';

@Injectable()
export class ProjectVideoService {
  constructor(private folderPathService: FolderPathService) {}
  async getVideos(projectSlug: string, eventId: string) {
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );
    const videoPath = join(folder, 'recording.webm');
    const videoStream = createReadStream(videoPath);
    return new StreamableFile(videoStream);
  }
}
