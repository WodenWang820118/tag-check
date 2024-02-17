import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Logger,
} from '@nestjs/common';
import { WaiterReportService } from './waiter-report.service';

@Controller('reports')
export class WaiterReportController {
  constructor(private waiterReportService: WaiterReportService) {}

  @Get(':projectSlug')
  async getProjectReports(@Param('projectSlug') projectSlug: string) {
    return await this.waiterReportService.getProjectReports(projectSlug);
  }

  // TODO: haven't been tested
  @Put(':projectSlug')
  async updateReport(
    @Param('projectSlug') projectSlug: string,
    @Body() report: any
  ) {
    Logger.log('updateReport', report);
    return await this.waiterReportService.updateReport(projectSlug, report);
  }

  @Post(':projectSlug')
  async addReport(
    @Param('projectSlug') projectSlug: string,
    @Body() report: any
  ) {
    return await this.waiterReportService.addReport(projectSlug, report);
  }
}
