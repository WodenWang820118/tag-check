import { Injectable, Logger } from '@nestjs/common';
import type { DeleteRunsResponse } from '@utils';
import { rm } from 'node:fs/promises';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { XlsxReportService } from '../../../infrastructure/os/xlsx-report/xlsx-report.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { RECORDING_FILES } from '../../../shared';

/**
 * The Reports page's data: the project's runs, deleting runs, and the
 * spreadsheet export of chosen tests.
 */
@Injectable()
export class ProjectFileReportService {
  private readonly logger = new Logger(ProjectFileReportService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly xlsxReportService: XlsxReportService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService
  ) {}

  /** Every run of the project's tests, newest first. */
  async listRuns(projectSlug: string) {
    return this.testEventDetailRepositoryService.listRunSummaries(projectSlug);
  }

  /**
   * Deletes the project's runs with these ids and the screenshots they saved;
   * the tests stay. Every run replaces the test's screen recordings (the
   * site's and, in accompanied mode, Tag Assistant's), so a test whose latest
   * run is deleted loses both.
   */
  async deleteRuns(
    projectSlug: string,
    runIds: number[]
  ): Promise<DeleteRunsResponse> {
    const { deletedRunIds, latestRunDeletedEventIds } =
      await this.testEventDetailRepositoryService.deleteRuns(
        projectSlug,
        runIds
      );
    await Promise.all(
      latestRunDeletedEventIds.map(async (eventId) => {
        const folder =
          await this.folderPathService.getInspectionEventFolderPath(
            projectSlug,
            eventId
          );
        await Promise.all(
          Object.values(RECORDING_FILES).map((file) =>
            rm(join(folder, file), { force: true })
          )
        );
      })
    );
    this.logger.log(`Deleted ${deletedRunIds.length} run(s) of ${projectSlug}`);
    return { deletedRunIds };
  }

  /**
   * The spreadsheet of the chosen tests.
   *
   * @throws Error when none of the event IDs is a test of the project.
   */
  async downloadReportFiles(projectSlug: string, eventIds: string[]) {
    const reports = await this.testEventRepositoryService.getBySlugAndEventIds(
      projectSlug,
      eventIds
    );
    if (!reports || reports.length === 0) {
      throw new Error('No reports found');
    }
    return await this.xlsxReportService.writeXlsxFile(reports);
  }
}
