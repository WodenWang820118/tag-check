import { Injectable, NotFoundException } from '@nestjs/common';
import type { StepFailureContext } from '@utils';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { RunRecordingsService } from '../../infrastructure/os/run-recordings/run-recordings.service';

/**
 * What a run's step saw when it could not find its element, kept beside the
 * run's recordings (so only by the test's latest RUN_RECORDINGS_KEPT runs).
 */
@Injectable()
export class StepFailureService {
  constructor(
    private readonly testEventDetails: TestEventDetailRepositoryService,
    private readonly runRecordings: RunRecordingsService
  ) {}

  /**
   * Run `runId`'s failed step, or the latest run's without one.
   *
   * @throws NotFoundException when the run does not exist or kept none.
   */
  async get(
    projectSlug: string,
    eventId: string,
    runId?: number
  ): Promise<StepFailureContext> {
    const runs = await this.testEventDetails.listRunHistory(
      projectSlug,
      eventId
    );
    const run =
      runId === undefined ? runs[0] : runs.find((row) => row.runId === runId);
    const context = run?.recordingKey
      ? await this.runRecordings.readStepFailure(
          projectSlug,
          eventId,
          run.recordingKey
        )
      : null;
    if (!context) {
      throw new NotFoundException(
        'This run kept no record of a step that could not find its element'
      );
    }
    return context;
  }
}
