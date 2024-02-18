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

  // TODO: temporary solution to return the same structure as the json-server's mock backend
  // but there might be a better way to optimize the data structure
  async getProjectRecordings(projectSlug: string) {
    const folderNames = this.folderService.getJsonFilesFromDir(
      await this.folderPathService.getRecordingFolderPath(projectSlug)
    );

    const recordings = await Promise.all(
      folderNames.map(async (fileName) => {
        return await this.fileService.readJsonFile(
          await this.folderPathService.getRecordingFilePath(
            projectSlug,
            fileName
          )
        );
      })
    );
    return {
      projectSlug: projectSlug,
      recordings: recordings,
    };
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
