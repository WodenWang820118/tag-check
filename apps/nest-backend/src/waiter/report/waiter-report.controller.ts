import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Logger,
  Header,
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

  @ApiOperation({
    summary: 'read report(s) from a specifc project',
    description:
      'This endpoint reads report(s) from a specifc project. \
      If multiple reports are found, it will return an array of report names.',
  })
  @ApiParam({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiParam({
    name: 'eventName',
    description: 'The name of the test associated with the event.',
  })
  @Get('xlsx/:projectSlug/:eventName')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  @Header('Content-Disposition', 'attachment; filename="report.xlsx"')
  async downloadXlsxReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string
  ) {
    return await this.waiterReportService.downloadXlsxReport(
      projectSlug,
      eventName
    );
  }
}
