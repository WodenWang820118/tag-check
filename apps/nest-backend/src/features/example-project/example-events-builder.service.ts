import { Injectable, Logger } from '@nestjs/common';
import { ProjectReportService } from '../project-agent/project-report/project-report.service';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
import { v4 as uuidv4 } from 'uuid';
import { events } from './events/events';
import { IReportDetails } from '@utils';
import { CreateFullTestEventDto } from '../../shared';
import { ProjectRecordingService } from '../project-agent/project-recording/project-recording.service';

@Injectable()
export class ExampleEventsBuilderService {
  private readonly logger = new Logger(ExampleEventsBuilderService.name);

  constructor(
    private readonly projectReportService: ProjectReportService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly projectRecordingService: ProjectRecordingService
  ) {}

  async buildEvents(projectSlug: string): Promise<void> {
    this.logger.debug(`Building example events for project=${projectSlug}`);
    for (const { eventName, testName, recording, spec } of Object.values(
      events
    )) {
      const eventId = uuidv4();
      const reportDetail: IReportDetails = {
        position: 0,
        event: eventName,
        eventName,
        testName,
        eventId,
        stopNavigation: false,
        message: 'This is a standard test',
        passed: false,
        requestPassed: false,
        rawRequest: '',
        destinationUrl: '',
        dataLayer: [],
        reformedDataLayer: [],
        createdAt: new Date()
      };

      const fullReport: CreateFullTestEventDto = {
        reportDetails: reportDetail,
        recording,
        spec
      };

      await this.projectReportService.createEventReportFolder(
        projectSlug,
        eventId
      );

      // save the recording JSON to project recordings folder
      await this.projectRecordingService.addRecording(
        projectSlug,
        eventId,
        recording
      );

      await this.testReportFacadeRepositoryService.createFullReport(
        projectSlug,
        eventId,
        fullReport
      );
    }
  }
}
