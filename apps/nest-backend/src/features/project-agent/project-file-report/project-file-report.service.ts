import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { DeleteRunsResponse } from '@utils';
import { RunRecordingsService } from '../../../infrastructure/os/run-recordings/run-recordings.service';
import { XlsxReportService } from '../../../infrastructure/os/xlsx-report/xlsx-report.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import {
  FullTestEventResponseDto,
  TestEventDetailResponseDto,
  TestImageResponseDto
} from '../../../shared';

/**
 * The Reports page's data: the project's runs, deleting runs, and the
 * spreadsheet export of chosen tests.
 */
@Injectable()
export class ProjectFileReportService {
  private readonly logger = new Logger(ProjectFileReportService.name);
  constructor(
    private readonly runRecordingsService: RunRecordingsService,
    private readonly xlsxReportService: XlsxReportService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService
  ) {}

  /** Every run of the project's tests, newest first. */
  async listRuns(projectSlug: string) {
    return this.testEventDetailRepositoryService.listRunSummaries(projectSlug);
  }

  /**
   * Deletes the project's runs with these ids, the screenshots and the
   * screen recordings they saved; the tests stay. A test whose latest run
   * is deleted also loses the recordings runs saved before keeping their own
   * left in its folder, which were that run's.
   */
  async deleteRuns(
    projectSlug: string,
    runIds: number[]
  ): Promise<DeleteRunsResponse> {
    const { deletedRunIds, latestRunDeletedEventIds, deletedRecordings } =
      await this.testEventDetailRepositoryService.deleteRuns(
        projectSlug,
        runIds
      );
    await this.runRecordingsService.removeRuns(projectSlug, deletedRecordings);
    await Promise.all(
      latestRunDeletedEventIds.map((eventId) =>
        this.runRecordingsService.removeLegacy(projectSlug, eventId)
      )
    );
    this.logger.log(`Deleted ${deletedRunIds.length} run(s) of ${projectSlug}`);
    return { deletedRunIds };
  }

  /**
   * The spreadsheet of the chosen tests, or just the chosen run.
   *
   * @throws Error when none of the event IDs is a test of the project.
   */
  async downloadReportFiles(
    projectSlug: string,
    eventIds: string[],
    runId?: number
  ) {
    const reports = await this.testEventRepositoryService.getBySlugAndEventIds(
      projectSlug,
      eventIds
    );
    if (!reports || reports.length === 0) {
      throw new Error('No reports found');
    }
    if (runId !== undefined) {
      const selectedReports: FullTestEventResponseDto[] = [];
      for (const report of reports) {
        const runs: TestEventDetailResponseDto[] = Array.isArray(
          report.testEventDetails
        )
          ? report.testEventDetails
          : [report.testEventDetails];
        const run = runs.find((entry) => entry?.id === runId);
        if (!run) continue;
        const image =
          await this.testEventDetailRepositoryService.getRunScreenshot(
            projectSlug,
            report.eventId,
            runId,
            true
          );
        selectedReports.push(
          plainToInstance(FullTestEventResponseDto, {
            ...report,
            testEventDetails: [run],
            latestTestEventDetail: run,
            latestTestImage: image
              ? plainToInstance(TestImageResponseDto, image)
              : undefined,
            message: run.message ?? ''
          })
        );
      }
      if (selectedReports.length === 0) {
        throw new NotFoundException('Run not found');
      }
      return await this.xlsxReportService.writeXlsxFile(selectedReports);
    }
    return await this.xlsxReportService.writeXlsxFile(reports);
  }
}
