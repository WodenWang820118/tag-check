import { Injectable, Logger } from '@nestjs/common';
import type { DeleteRunsResponse } from '@utils';
import { rm } from 'node:fs/promises';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { XlsxReportService } from '../../../infrastructure/os/xlsx-report/xlsx-report.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { RECORDING_FILES } from '../../../shared';

@Injectable()
export class ProjectFileReportService {
  private readonly logger = new Logger(ProjectFileReportService.name);
  constructor(
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService,
    private readonly xlsxReportService: XlsxReportService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService
  ) {}

  async listRuns(projectSlug: string) {
    return this.testEventDetailRepositoryService.listRunSummaries(projectSlug);
  }

  async getReportFolders(projectSlug: string) {
    const folderPath =
      await this.folderPathService.getReportSavingFolderPath(projectSlug);
    const data = this.folderService.readFolder(folderPath);
    return data.map((dirent) => {
      return {
        name: dirent.name,
        path: join(dirent.parentPath, dirent.name)
      };
    });
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
