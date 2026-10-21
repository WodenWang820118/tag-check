import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { ProjectFileReportService } from '../../features/project-agent/project-file-report/project-file-report.service';

@Controller('file-reports')
export class FileReportsController {
  constructor(
    private readonly projectFileReportService: ProjectFileReportService
  ) {}

  @Delete(':projectSlug/:eventId')
  async deleteReportFile(
    @Param('projectSlug') projectSlug: string,
    @Query('filePath') filePath: string
  ) {
    return this.projectFileReportService.deleteReportFile(
      projectSlug,
      filePath
    );
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
