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
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';

@Controller('file-reports')
export class FileReportsController {
  constructor(
    private readonly projectFileReportService: ProjectFileReportService,
    private readonly testEventFileRepositoryService: TestEventRepositoryService
  ) {}

  @Delete(':projectSlug/:eventId')
  @Log()
  async deleteReportFile(
    @Param('projectSlug') projectSlug: string,
    @Query('filePath') filePath: string
  ) {
    return this.projectFileReportService.deleteReportFile(
      projectSlug,
      filePath
    );
  }

  @Get(':projectSlug')
  async getReportFiles(@Param('projectSlug') projectSlug: string) {
    return this.testEventFileRepositoryService.listFileReports(projectSlug);
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
