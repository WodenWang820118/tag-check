import { Injectable } from '@nestjs/common';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { Recording } from '@utils';

/**
 * Writes a test's Chrome Recorder recording to
 * `<project>/recordings/<eventId>.json`, next to the copy in the database,
 * so the project folder (and an exported zip) holds every recording.
 */
@Injectable()
export class ProjectRecordingService {
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService
  ) {}

  async addRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    await this.saveRecording(projectSlug, eventId, recording);
  }

  async updateRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    await this.saveRecording(projectSlug, eventId, recording);
  }

  private async saveRecording(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ): Promise<void> {
    const recordingPath = await this.filePathService.getRecordingFilePath(
      projectSlug,
      `${eventId}.json`
    );
    this.fileService.writeJsonFile(recordingPath, recording);
  }
}
