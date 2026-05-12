import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Logger,
  Delete
} from '@nestjs/common';
import type { IReportDetails } from '@utils';
import { ProjectReportService } from '../../features/project-agent/project-report/project-report.service';
import { ProjectAbstractReportService } from '../../features/project-agent/project-abstract-report/project-abstract-report.service';
import { TestReportFacadeRepositoryService } from '../../features/repository/test-report-facade/test-report-facade-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { CreateFullTestEventDto, UpdateTestEventDto } from '../../shared';

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
  async getProjectEventReports(@Param('projectSlug') projectSlug: string) {
    const reports =
      await this.testEventRepositoryService.listReports(projectSlug);
    this.logger.log(
      `getProjectEventReports: projectSlug=${projectSlug}, count=${Array.isArray(reports) ? reports.length : 0}`
    );
    return reports;
  }

  @Delete(':projectSlug')
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
  async updateReport(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() report: IReportDetails
  ) {
    this.logger.log(
      `updateReport: projectSlug=${projectSlug}, eventId=${eventId}, keys=${Object.keys(report).join(',')}`
    );

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
    Logger.log(
      `addReport: projectSlug=${projectSlug}, eventId=${eventId}, keys=${Object.keys(reportData as Record<string, unknown>).join(',')}`
    );
    // Video isn't suitable to be saved in SQL DB as a blob
    // Use file system to save video instead
    await this.projectReportService.createEventReportFolder(
      projectSlug,
      eventId
    );

    return this.testReportFacadeRepositoryService.createFullReport(
      projectSlug,
      eventId,
      reportData
    );
  }

  @Delete(':projectSlug/:eventId')
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

  @Put(':projectSlug')
  async updateTestEvents(
    @Param('projectSlug') projectSlug: string,
    @Body() reports: IReportDetails[]
  ) {
    const events = reports.map((report) => {
      const event = new UpdateTestEventDto();
      event.eventId = report.eventId;
      event.testName = report.testName;
      event.eventName = report.eventName;
      event.message = report.message;
      event.stopNavigation = report.stopNavigation;
      return event;
    });
    return await this.testEventRepositoryService.updateTestEvents(
      projectSlug,
      events
    );
  }
}
