import { BadRequestException, Injectable } from '@nestjs/common';
import { validateSelectorTrial, type SelectorTrialResponse } from '@utils';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestRunService } from '../test-run/test-run.service';

/**
 * Tries other selectors for one step: a headless run of the test, as its
 * project's settings ask, in which that step tries them instead of its own.
 * The recording does not change; the run is saved like any other.
 */
@Injectable()
export class SelectorTrialService {
  constructor(
    private readonly recordings: RecordingRepositoryService,
    private readonly testEventDetails: TestEventDetailRepositoryService,
    private readonly testRun: TestRunService
  ) {}

  /**
   * Runs the trial and resolves with the run it saved, once it is saved.
   *
   * @throws BadRequestException for an invalid body, or a step the
   *   recording does not have or that has no selectors.
   */
  async run(
    projectSlug: string,
    eventId: string,
    body: unknown
  ): Promise<SelectorTrialResponse> {
    const validation = validateSelectorTrial(body);
    if (!validation.ok) {
      throw new BadRequestException(validation.error);
    }
    const { request } = validation;
    const recording = await this.recordings.getRecordingDetails(
      projectSlug,
      eventId
    );
    const step = recording?.steps?.[request.stepIndex];
    if (!step?.selectors?.length) {
      throw new BadRequestException(
        `Step ${request.stepIndex + 1} of the recording has no selectors to replace`
      );
    }

    await this.testRun.run(projectSlug, eventId, {
      headless: true,
      stepOverride: request
    });

    const [run] = await this.testEventDetails.listRunHistory(
      projectSlug,
      eventId
    );
    return {
      runId: run.runId,
      passed: run.passed,
      requestPassed: run.requestPassed
    };
  }
}
