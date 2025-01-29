import {
  Body,
  Controller,
  Delete,
  Get,
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
    private projectFileReportService: ProjectFileReportService,
    private testEventFileRepositoryService: TestEventRepositoryService
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
  @Log()
  async getReportFiles(@Param('projectSlug') projectSlug: string) {
    return this.projectFileReportService.getReportFolderFiles(projectSlug);
  }

  @Post('/download/:projectSlug')
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
