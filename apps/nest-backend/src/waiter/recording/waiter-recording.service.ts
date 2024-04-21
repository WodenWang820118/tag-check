import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { RecordingDto } from '../../dto/recording.dto';

@Injectable()
export class WaiterRecordingService {
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

      const recordings: RecordingDto = (await Promise.all(
        folderNames.map(async (fileName) => {
          return await this.fileService.readJsonFile(
            await this.filePathService.getRecordingFilePath(
              projectSlug,
              fileName
            )
          );
        })
      )) as any;

      return {
        projectSlug: projectSlug,
        recordings: recordings,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(
        error.message,
        'WaiterRecordingService.getProjectRecordings'
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectRecordingNames(projectSlug: string) {
    try {
      const fileNames = this.folderService.getJsonFilesFromDir(
        await this.folderPathService.getRecordingFolderPath(projectSlug)
      );
      return fileNames.map((fileName) => fileName.replace('.json', ''));
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjectRecordings');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRecordingDetails(projectSlug: string, recordingId: string) {
    try {
      const content = await this.fileService.readJsonFile(
        await this.filePathService.getRecordingFilePath(
          projectSlug,
          `${recordingId}.json`
        )
      );

      return content;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(error.message, 'WaiterRecordingService.getRecordingDetails');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addRecording(projectSlug: string, eventId: string, recording: any) {
    try {
      const recordingPath = await this.filePathService.getRecordingFilePath(
        projectSlug,
        `${eventId}.json`
      );

      this.fileService.writeJsonFile(recordingPath, recording.data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(error.message, 'WaiterRecordingService.addRecording');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
