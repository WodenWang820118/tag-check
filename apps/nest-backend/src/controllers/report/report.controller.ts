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
import { IReportDetails } from '@utils';
import { ProjectReportService } from '../../features/project-agent/project-report/project-report.service';
import { ProjectAbstractReportService } from '../../features/project-agent/project-abstract-report/project-abstract-report.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { TestReportFacadeRepositoryService } from '../../features/repository/test-report-facade/test-report-facade-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { CreateFullTestEventDto } from '../../shared';

@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);
  constructor(
    private readonly projectReportService: ProjectReportService,
    private readonly projectAbstractReportService: ProjectAbstractReportService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly testEventRepositoryService: TestEventRepositoryService
  ) {}

  @Get(':projectSlug')
  @Log()
  async getProjectEventReports(@Param('projectSlug') projectSlug: string) {
    const reports =
      await this.testEventRepositoryService.listReports(projectSlug);
    console.log(reports);
    return reports;
  }

  @Delete(':projectSlug')
  @Log()
  async deleteProjectEventReports(
    @Param('projectSlug') projectSlug: string,
    @Body() eventIds: string[]
  ) {
    return await this.testEventRepositoryService.deleteByProjectSlugAndEventIds(
      projectSlug,
      eventIds
    );
  }

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

  @Post(':projectSlug/:eventId')
  async addReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() reportData: CreateFullTestEventDto
  ) {
    Logger.log(`addReport: ${JSON.stringify(reportData, null, 2)}`);
    return this.testReportFacadeRepositoryService.createFullReport(
      projectSlug,
      eventId,
      reportData
    );
  }

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

  @Get(':projectSlug/:eventId')
  async getReportDetails(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.testReportFacadeRepositoryService.getReportDetail(
      projectSlug,
      eventId
    );
  }
}
