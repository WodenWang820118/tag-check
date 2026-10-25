import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Query
} from '@nestjs/common';
import type { DeleteRunsResponse } from '@utils';
import { ProjectFileReportService } from '../../features/project-agent/project-file-report/project-file-report.service';

/**
 * The Reports page: the project's runs, deleting runs, and the spreadsheet
 * export.
 */
@Controller('file-reports')
export class FileReportsController {
  constructor(
    private readonly projectFileReportService: ProjectFileReportService
  ) {}

  /**
   * Deletes runs and their screenshots; the tests stay.
   * `runIds` is a comma-separated list, such as `?runIds=7,9`.
   */
  @Delete(':projectSlug')
  async deleteRuns(
    @Param('projectSlug') projectSlug: string,
    @Query('runIds') runIds: string | undefined
  ): Promise<DeleteRunsResponse> {
    const ids = (runIds ?? '').split(',').map((id) => Number(id.trim()));
    if (!ids.every((id) => Number.isSafeInteger(id) && id > 0)) {
      throw new BadRequestException(
        'runIds must be a comma-separated list of run ids'
      );
    }
    return await this.projectFileReportService.deleteRuns(projectSlug, ids);
  }

  /** Every run of the project's tests, newest first (RunSummary[]). */
  @Get(':projectSlug')
  async listRuns(@Param('projectSlug') projectSlug: string) {
    return this.projectFileReportService.listRuns(projectSlug);
  }

  @Post('/download/:projectSlug')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  @Header('Content-Disposition', 'attachment; filename="report.xlsx"')
  async downloadReportFiles(
    @Param('projectSlug') projectSlug: string,
    @Body() eventIds: string[]
  ) {
    return await this.projectFileReportService.downloadReportFiles(
      projectSlug,
      eventIds
    );
  }
}
