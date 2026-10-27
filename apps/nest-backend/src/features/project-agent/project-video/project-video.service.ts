import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { RunRecordingsService } from '../../../infrastructure/os/run-recordings/run-recordings.service';
import { RECORDING_FILES, RecordingFile } from '../../../shared';

/**
 * Streams a run's screen recording (the test's latest run by default), or
 * an empty file when the run kept none.
 */
@Injectable()
export class ProjectVideoService {
  constructor(
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly runRecordingsService: RunRecordingsService
  ) {}

  async getVideos(
    projectSlug: string,
    eventId: string,
    file: RecordingFile = RECORDING_FILES.site,
    runId?: number
  ) {
    const runs = await this.testEventDetailRepositoryService.listRunHistory(
      projectSlug,
      eventId
    );
    const index =
      runId === undefined ? 0 : runs.findIndex((run) => run.runId === runId);
    const run = runs[index];
    const videoPath = run
      ? await this.runRecordingsService.fileOf(
          projectSlug,
          eventId,
          { recordingKey: run.recordingKey, latest: index === 0 },
          file
        )
      : null;

    Logger.debug(`Video path: ${videoPath}`, ProjectVideoService.name);

    if (!videoPath) {
      const readable = new Readable();
      readable.push(null);
      return new StreamableFile(readable);
    }

    const videoStream = createReadStream(videoPath);
    return new StreamableFile(videoStream);
  }
}
