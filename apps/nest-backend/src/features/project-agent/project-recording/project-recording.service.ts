import { Injectable } from '@nestjs/common';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
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
    private readonly filePathService: FilePathService,
    private readonly recordingRepositoryService: RecordingRepositoryService
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

  /**
   * Writes the new title and steps to the database, then to the project
   * folder. A run reads the site domain from that file. If the file write
   * throws, the database row is put back to the title and steps read first
   * and the error is rethrown.
   */
  async updateRecordingAndFile(
    projectSlug: string,
    eventId: string,
    recording: Recording
  ) {
    const current = await this.recordingRepositoryService.getRecordingDetails(
      projectSlug,
      eventId
    );
    const updated = await this.recordingRepositoryService.update(
      projectSlug,
      eventId,
      { title: recording.title, steps: recording.steps }
    );
    try {
      await this.saveRecording(projectSlug, eventId, {
        title: recording.title,
        steps: recording.steps
      });
    } catch (error) {
      await this.restoreRecording(projectSlug, eventId, current);
      throw error;
    }
    return updated;
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

  private async restoreRecording(
    projectSlug: string,
    eventId: string,
    current: { title?: string; steps?: Recording['steps'] } | null
  ): Promise<void> {
    if (
      current === null ||
      typeof current.title !== 'string' ||
      !Array.isArray(current.steps)
    ) {
      return;
    }

    await this.recordingRepositoryService.update(projectSlug, eventId, {
      title: current.title,
      steps: current.steps
    });
  }
}
