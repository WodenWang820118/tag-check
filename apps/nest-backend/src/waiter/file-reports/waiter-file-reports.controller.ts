import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectFileReportService } from '../../project-agent/project-file-report/project-file-report.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Controller('file-reports')
export class WaiterFileReportsController {
  constructor(private projectFileReportService: ProjectFileReportService) {}

  @Delete(':projectSlug')
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

  @Post('/download')
  @Log()
  async downloadReportFiles(@Body() body: { filePaths: string[] }) {
    return await this.projectFileReportService.downloadReportFiles(
      body.filePaths
    );
  }
}
