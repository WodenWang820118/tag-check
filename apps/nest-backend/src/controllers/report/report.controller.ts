import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Logger,
  Header,
  Delete
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { IReportDetails } from '@utils';
import { ProjectReportService } from '../../features/project-agent/project-report/project-report.service';
import { ProjectAbstractReportService } from '../../features/project-agent/project-abstract-report/project-abstract-report.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { FullValidationResultService } from '../../features/repository/test-report-facade/full-validation-result.service';
import { TestReportFacadeRepositoryService } from '../../features/repository/test-report-facade/test-report-facade-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';

@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);
  constructor(
    private readonly projectReportService: ProjectReportService,
    private readonly projectAbstractReportService: ProjectAbstractReportService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly fullValidationResultService: FullValidationResultService,
    private readonly testEventRepositoryService: TestEventRepositoryService
  ) {}

  @ApiOperation({
    summary: 'get project reports',
    description:
      'Get all reports for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @Get(':projectSlug')
  @Log()
  async getProjectEventReports(@Param('projectSlug') projectSlug: string) {
    const reports =
      await this.testEventRepositoryService.listReports(projectSlug);
    console.log(reports);
    return reports;
  }

  @ApiOperation({
    summary: 'get report folder names',
    description:
      'Get all report folder names for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @Get(':projectSlug/names')
  async getProjectEventReportNames(@Param('projectSlug') projectSlug: string) {
    // it equals to get unique test event ids
    return await this.projectReportService.getProjectEventReportFolderNames(
      projectSlug
    );
  }

  @ApiOperation({
    summary: 'update project report',
    description:
      'Update a report for a project. The project is identified by the projectSlug. The report is identified by the eventName.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the test associated with the event.'
  })
  @ApiBody({
    description: 'The report to be updated.',
    type: Object
  })
  @Put(':projectSlug/:eventId')
  @Log()
  async updateReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() report: IReportDetails
  ) {
    // TODO: Unify the implmentation and use database for all reports
    this.logger.log(`updateReport: ${JSON.stringify(report, null, 2)}`);

    await this.projectAbstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      report
    );
  }

  @ApiOperation({
    summary: 'add a new project report',
    description:
      'Add a new report for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the test associated with the event.'
  })
  @ApiBody({
    description: 'The report to be added.',
    type: Object
  })
  @Post(':projectSlug/:eventId')
  @Log()
  async addReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() report: IReportDetails
  ) {
    return this.testReportFacadeRepositoryService.createTestFileReport(report);
  }

  @ApiOperation({
    summary: 'read report(s) from a specifc project',
    description:
      'This endpoint reads report(s) from a specifc project. \
      If multiple reports are found, it will return an array of report names.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The id of the test associated with the event.'
  })
  @Get('xlsx/:projectSlug/:eventId')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  @Header('Content-Disposition', 'attachment; filename="report.xlsx"')
  @Log()
  async downloadXlsxReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectReportService.downloadXlsxReport(
      projectSlug,
      eventId
    );
  }

  @ApiOperation({
    summary: 'delete report from a specifc project',
    description:
      'This endpoint deletes report(s) from a specifc project. \
      If multiple reports are found, it will delete all of them.'
  })
  @ApiParam({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the test associated with the event.'
  })
  @Delete(':projectSlug/:eventId')
  @Log()
  async deleteReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectAbstractReportService.deleteSingleAbstractTestResultFolder(
      projectSlug,
      eventId
    );
  }

  @ApiOperation({
    summary: 'get report details',
    description:
      'Get the details of a report for a project. The project is identified by the projectSlug. The report is identified by the eventId.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the test associated with the event.'
  })
  @Get(':projectSlug/:eventId')
  async getReportDetails(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return (
      (await this.fullValidationResultService.getSingleReportDetailsData(
        eventId
      )) ??
      (await this.projectAbstractReportService.getSingleAbstractTestResultJson(
        projectSlug,
        eventId
      ))
    );
  }
}
