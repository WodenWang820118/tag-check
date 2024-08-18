import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { RecordingDto } from '../../dto/recording.dto';
import { Recording } from '@utils';

@Injectable()
export class ProjectRecordingService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private folderService: FolderService,
    private folderPathService: FolderPathService
  ) {}

  // TODO: temporary solution to return the same structure as the json-server's mock backend
  // but there might be a better way to optimize the data structure
  async getProjectRecordings(projectSlug: string) {
    try {
      const folderNames = this.folderService.getJsonFilesFromDir(
        await this.folderPathService.getRecordingFolderPath(projectSlug)
      );

      const recordings = await Promise.all(
        folderNames.map(async (fileName) => {
          const recordingContent = await this.fileService.readJsonFile(
            await this.filePathService.getRecordingFilePath(
              projectSlug,
              fileName
            )
          );
          const key = fileName.replace('.json', '');
          return { [key]: recordingContent };
        })
      );

      const flattenedRecordings: Record<string, RecordingDto> =
        recordings.reduce((acc, recording) => {
          return { ...acc, ...recording };
        }, {});

      return {
        projectSlug: projectSlug,
        recordings: flattenedRecordings,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        Logger.error(
          error,
          `${ProjectRecordingService.name}.${ProjectRecordingService.prototype.getProjectRecordings.name}`
        );
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      throw error;
    }
  }

  async getProjectRecordingNames(projectSlug: string) {
    try {
      const fileNames = this.folderService.getJsonFilesFromDir(
        await this.folderPathService.getRecordingFolderPath(projectSlug)
      );
      return fileNames.map((fileName) => fileName.replace('.json', ''));
    } catch (error) {
      Logger.error(error, 'ProjectRecordingService.getProjectRecordings');
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRecordingDetails(projectSlug: string, eventId: string) {
    try {
      const content = await this.fileService.readJsonFile(
        await this.filePathService.getRecordingFilePath(
          projectSlug,
          `${eventId}.json`
        )
      );

      return content;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(error, 'ProjectRecordingService.getRecordingDetails');
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    try {
      const recordingPath = await this.filePathService.getRecordingFilePath(
        projectSlug,
        `${eventId}.json`
      );

      this.fileService.writeJsonFile(recordingPath, recording);
    } catch (error) {
      if (error instanceof HttpException) {
        Logger.error(
          error,
          `${ProjectRecordingService.name}.${ProjectRecordingService.prototype.addRecording.name}`
        );
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw error;
    }
  }

  async updateRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    try {
      const recordingPath = await this.filePathService.getRecordingFilePath(
        projectSlug,
        `${eventId}.json`
      );

      this.fileService.writeJsonFile(recordingPath, recording);
    } catch (error) {
      if (error instanceof HttpException) {
        Logger.error(
          error,
          `${ProjectRecordingService.name}.${ProjectRecordingService.prototype.updateRecording.name}`
        );
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw error;
    }
  }
}
