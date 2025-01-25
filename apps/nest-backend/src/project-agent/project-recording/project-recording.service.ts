import { Injectable } from '@nestjs/common';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { RecordingDto } from '../../shared/dto/recording.dto';
import { Recording } from '@utils';

@Injectable()
export class ProjectRecordingService {
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService,
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService
  ) {}

  // TODO: temporary solution to return the same structure as the json-server's mock backend
  // but there might be a better way to optimize the data structure
  async getProjectRecordings(projectSlug: string) {
    const folderNames = this.folderService.getJsonFilesFromDir(
      await this.folderPathService.getRecordingFolderPath(projectSlug)
    );

    const recordings: Record<string, RecordingDto>[] = await Promise.all(
      folderNames.map(async (fileName) => {
        const recordingContent = this.fileService.readJsonFile<RecordingDto>(
          await this.filePathService.getRecordingFilePath(projectSlug, fileName)
        );
        const key = fileName.replace('.json', '');
        return { [key]: recordingContent };
      })
    );

    const flattenedRecordings: Record<string, RecordingDto> = recordings.reduce(
      (acc, recording) => {
        const key = Object.keys(recording)[0];
        acc[key] = { ...recording[key], ...recording };
        return acc;
      },
      {}
    );

    return {
      projectSlug: projectSlug,
      recordings: flattenedRecordings
    };
  }

  async getProjectRecordingNames(projectSlug: string) {
    const fileNames = this.folderService.getJsonFilesFromDir(
      await this.folderPathService.getRecordingFolderPath(projectSlug)
    );
    return fileNames.map((fileName) => fileName.replace('.json', ''));
  }

  async getRecordingDetails(projectSlug: string, eventId: string) {
    const content = await this.fileService.readJsonFile(
      await this.filePathService.getRecordingFilePath(
        projectSlug,
        `${eventId}.json`
      )
    );
    return content;
  }

  async addRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    const recordingPath = await this.filePathService.getRecordingFilePath(
      projectSlug,
      `${eventId}.json`
    );
    this.fileService.writeJsonFile(recordingPath, recording);
  }

  async updateRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    const recordingPath = await this.filePathService.getRecordingFilePath(
      projectSlug,
      `${eventId}.json`
    );
    this.fileService.writeJsonFile(recordingPath, recording);
  }
}
