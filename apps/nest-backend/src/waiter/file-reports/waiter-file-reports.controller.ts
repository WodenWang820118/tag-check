import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectFileReportService } from '../../project-agent/project-file-report/project-file-report.service';

@Controller('file-reports')
export class WaiterFileReportsController {
  constructor(private projectFileReportService: ProjectFileReportService) {}

  @Delete(':projectSlug')
  async deleteReportFile(
    @Param('projectSlug') projectSlug: string,
    @Query('filePath') filePath: string
  ) {
    Logger.log(filePath, `Deleting file`);
    return this.projectFileReportService.deleteReportFile(
      projectSlug,
      filePath
    );
  }

  @Get(':projectSlug')
  async getReportFiles(@Param('projectSlug') projectSlug: string) {
    return this.projectFileReportService.getReportFolderFiles(projectSlug);
  }

  @Post('/download')
  async downloadReportFiles(@Body() body: { filePaths: string[] }) {
    return await this.projectFileReportService.downloadReportFiles(
      body.filePaths
    );
  }
}
