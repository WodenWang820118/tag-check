import { Injectable, Logger } from '@nestjs/common';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { SingleEventInspectionService } from '../event-inspection/single-event-inspection.service';
import { GtmOperatorService } from '../gtm-operator/gtm-operator.service';
import { buildRunPlan, toRunSettings } from './run-options';

/**
 * Runs one test the way its project's settings ask for (see buildRunPlan),
 * for callers that have no run options of their own, such as the batch
 * queue. The run waits in the shared RunQueueService like any other.
 */
@Injectable()
export class TestRunService {
  private readonly logger = new Logger(TestRunService.name);

  constructor(
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly gtmOperatorService: GtmOperatorService,
    private readonly singleEventInspectionService: SingleEventInspectionService
  ) {}

  /**
   * Runs the test and resolves once its result is saved. The settings are
   * read when the run is requested, so a change applies to the next run.
   * Rejects as the run does (see GtmOperatorService and
   * SingleEventInspectionService), or with 404 for an unknown project.
   */
  async run(
    projectSlug: string,
    eventId: string,
    choice: { headless: boolean }
  ): Promise<void> {
    const project =
      await this.projectRepositoryService.getRunSettingsEntityBySlug(
        projectSlug
      );
    const plan = buildRunPlan(toRunSettings(project), {
      headless: choice.headless,
      // Nobody watches a queued run: never leave its window open.
      closeBrowser: true
    });
    this.logger.log(
      `Running ${projectSlug}/${eventId}: mode=${plan.mode}, headless=${choice.headless}`
    );
    if (plan.mode === 'accompanied') {
      await this.gtmOperatorService.inspectSingleEventViaGtm(
        projectSlug,
        eventId,
        plan.query,
        plan.preset
      );
      return;
    }
    await this.singleEventInspectionService.inspectSingleEvent(
      projectSlug,
      eventId,
      plan.options
    );
  }

  /**
   * Aborts the run in progress and drops the runs queued behind it, single
   * runs included: they share the queue.
   */
  stopAll(): void {
    this.singleEventInspectionService.abort();
  }
}
