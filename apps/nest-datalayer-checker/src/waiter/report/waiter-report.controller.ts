import { Controller, Get, Param, Put } from '@nestjs/common';
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
  async updateReport(@Param('projectSlug') projectSlug: string, report: any) {
    return await this.waiterReportService.updateReport(projectSlug, report);
  }

  // TODO: haven't been tested
  @Put()
  async addReport(reportForm: any) {
    return await this.waiterReportService.addReport(reportForm);
  }
}
