import { Injectable } from '@nestjs/common';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FileService } from '../../os/file/file.service';

@Injectable()
export class WaiterRecordingService {
  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService
  ) {}

  async getProjectRecordings(projectSlug: string) {
    return this.folderService.getJsonFilesFromDir(
      await this.folderPathService.getRecordingFolderPath(projectSlug)
    );
  }

  async getRecordingDetails(projectSlug: string, recordingId: string) {
    const content = await this.fileService.readJsonFile(
      await this.folderPathService.getRecordingFilePath(
        projectSlug,
        `${recordingId}.json`
      )
    );
    // TODO: to align the usage with the json-server's mock backend
    // but there might be a better way to do this
    return [
      {
        projecSlug: projectSlug,
        recordings: [content],
      },
    ];
  }
}
