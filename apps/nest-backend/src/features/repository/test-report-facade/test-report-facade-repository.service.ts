import { Injectable, Logger } from '@nestjs/common';
import type { ReportDetailResponse, RunHistoryEntry } from '@utils';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import { CreateFullTestEventDto } from '../../../shared';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
import { ItemDefRepositoryService } from '../../../core/repository/item-def/item-def-repository.service';
import { RunRecordingsService } from '../../../infrastructure/os/run-recordings/run-recordings.service';
import { RECORDING_FILES } from '../../../shared';

/**
 * Creates and reads a test together with the rows it owns (recording, spec,
 * item definition, results and screenshot), across their repositories.
 */
@Injectable()
export class TestReportFacadeRepositoryService {
  constructor(
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly testImageRepositoryService: TestImageRepositoryService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly itemDefRepositoryService: ItemDefRepositoryService,
    private readonly runRecordingsService: RunRecordingsService
  ) {}

  /**
   * Creates a test in the project with its recording, spec and, when given,
   * its item definition, and returns the test with its relations. Expects
   * `eventId` to equal `data.reportDetails.eventId`; rethrows any repository
   * error.
   */
  async createFullReport(
    projectSlug: string,
    eventId: string,
    data: CreateFullTestEventDto
  ) {
    try {
      // Get the project entity by slug
      const projectEntity =
        await this.projectRepositoryService.getEntityBySlug(projectSlug);

      // Create test event first
      await this.testEventRepositoryService.create(projectEntity, {
        eventId: data.reportDetails.eventId,
        testName: data.reportDetails.testName,
        eventName: data.reportDetails.eventName,
        message: data.reportDetails.message,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // eventId is unique only within a project; the example project and
      // an imported copy of it share every eventId.
      const testEvent =
        await this.testEventRepositoryService.getEntityBySlugAndEventId(
          projectSlug,
          eventId
        );

      // Create recording
      await this.recordingRepositoryService.create(testEvent, {
        title: data.reportDetails.eventName,
        steps: data.recording.steps ?? []
      });

      // Create spec
      await this.specRepositoryService.create(testEvent, {
        event: data.reportDetails.eventName,
        eventName: data.reportDetails.eventName,
        dataLayerSpec: data.dataLayerSpec,
        rawGtmTag: data.spec
      });

      // Create item definition if provided in the full report DTO
      if (data.fullItemDef) {
        await this.itemDefRepositoryService.create(testEvent, {
          fullItemDef: data.fullItemDef.fullItemDef,
          itemId: data.fullItemDef.itemId,
          templateName: data.fullItemDef.templateName
        });
      }

      // Fetch the complete updated test event with all relations
      const updatedTestEvent =
        await this.testEventRepositoryService.getBySlugAndEventId(
          projectSlug,
          eventId
        );

      return updatedTestEvent;
    } catch (error) {
      Logger.error('Error in createFullReport:', error);
      throw error;
    }
  }

  /**
   * Returns a test with its run `runId` (its latest run without one), a
   * summary of that run's screenshot (no image bytes) and the test's run
   * history; the run and screenshot are null when there is none.
   */
  async getReportDetail(
    projectSlug: string,
    eventId: string,
    runId?: number
  ): Promise<ReportDetailResponse> {
    const testEvent = await this.testEventRepositoryService.getBySlugAndEventId(
      projectSlug,
      eventId
    );

    const testEventDetails =
      await this.testEventDetailRepositoryService.getBySlugAndEventId(
        projectSlug,
        eventId,
        runId
      );

    // GET /projects/images serves the screenshot itself. Its bytes, encoded
    // as JSON, would add megabytes to every report and run response.
    const testImage =
      runId === undefined
        ? await this.testImageRepositoryService.getSummaryBySlugAndEventId(
            projectSlug,
            eventId
          )
        : await this.testEventDetailRepositoryService.getRunScreenshot(
            projectSlug,
            eventId,
            runId
          );

    return {
      testEvent,
      testEventDetails: testEventDetails ?? null,
      runs: await this.getRunHistory(projectSlug, eventId),
      testImage: testImage
        ? {
            id: testImage.id,
            imageName: testImage.imageName,
            imageSize: testImage.imageSize,
            createdAt: testImage.createdAt,
            updatedAt: testImage.updatedAt
          }
        : null
    };
  }

  /**
   * Every run of the test, newest first, and whether it kept its
   * recordings: in its own folder, or for the latest run saved before runs
   * kept their own, in the test's folder.
   */
  private async getRunHistory(
    projectSlug: string,
    eventId: string
  ): Promise<RunHistoryEntry[]> {
    const runs = await this.testEventDetailRepositoryService.listRunHistory(
      projectSlug,
      eventId
    );
    return Promise.all(
      runs.map(async ({ recordingKey, ...run }, index) => ({
        ...run,
        hasRecording:
          recordingKey !== null ||
          (index === 0 &&
            (await this.runRecordingsService.fileOf(
              projectSlug,
              eventId,
              { recordingKey: null, latest: true },
              RECORDING_FILES.site
            )) !== null)
      }))
    );
  }

  /**
   * Deletes the project's tests with these event IDs, with their runs and
   * screenshots, and what their runs left on disk (recordings, results).
   */
  async deleteTests(projectSlug: string, eventIds: string[]) {
    const removed =
      await this.testEventRepositoryService.deleteByProjectSlugAndEventIds(
        projectSlug,
        eventIds
      );
    const removedEventIds = (Array.isArray(removed) ? removed : [removed])
      .map((test) => test?.eventId)
      .filter((id): id is string => typeof id === 'string');
    await this.runRecordingsService.removeTests(projectSlug, removedEventIds);
    return removed;
  }
}
