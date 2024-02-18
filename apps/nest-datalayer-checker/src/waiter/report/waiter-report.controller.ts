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
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('reports')
export class WaiterReportController {
  constructor(private waiterReportService: WaiterReportService) {}

  @ApiOperation({
    summary: 'get project reports',
    description:
      'Get all reports for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @Get(':projectSlug')
  async getProjectReports(@Param('projectSlug') projectSlug: string) {
    return await this.waiterReportService.getProjectReports(projectSlug);
  }

  // TODO: haven't been tested
  @ApiOperation({
    summary: 'update project report',
    description:
      'Update a report for a project. The project is identified by the projectSlug. The report is identified by the eventName.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiBody({
    description: 'The report to be updated.',
    type: Object,
  })
  @Put(':projectSlug')
  async updateReport(
    @Param('projectSlug') projectSlug: string,
    @Body() report: any
  ) {
    Logger.log('updateReport', report);
    return await this.waiterReportService.updateReport(projectSlug, report);
  }

  @ApiOperation({
    summary: 'add a new project report',
    description:
      'Add a new report for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiBody({
    description: 'The report to be added.',
    type: Object,
  })
  @Post(':projectSlug')
  async addReport(
    @Param('projectSlug') projectSlug: string,
    @Body() report: any
  ) {
    return await this.waiterReportService.addReport(projectSlug, report);
  }
}
