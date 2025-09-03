import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IReportDetails,
  Recording,
  Spec,
  StrictDataLayerEvent,
  ItemDef
} from '@utils';
import { CreateFullTestEventDto } from '../../../shared';
import { ProjectReportService } from '../project-report/project-report.service';
import { TestReportFacadeRepositoryService } from '../../repository/test-report-facade/test-report-facade-repository.service';
import { ProjectRecordingService } from '../project-recording/project-recording.service';
import { ProjectDataLayerSpecBuilderService } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.service';

export type BuildEventInput = {
  eventName: string;
  testName: string;
  recording: Recording;
  spec: Spec;
  fullItemDef?: ItemDef;
};

@Injectable()
export class ProjectEventsBuilderService {
  private readonly logger = new Logger(ProjectEventsBuilderService.name);

  constructor(
    private readonly projectReportService: ProjectReportService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly projectRecordingService: ProjectRecordingService,
    private readonly dataLayerSpecBuilderService: ProjectDataLayerSpecBuilderService
  ) {}

  async buildEvents(
    projectSlug: string,
    inputs: BuildEventInput[]
  ): Promise<void> {
    for (const {
      eventName,
      testName,
      recording,
      spec,
      fullItemDef
    } of inputs) {
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

      const dataLayerSpec: StrictDataLayerEvent =
        this.dataLayerSpecBuilderService.buildDataLayerSpec(spec);

      const fullReport: CreateFullTestEventDto = {
        reportDetails: reportDetail,
        recording,
        spec,
        dataLayerSpec,
        fullItemDef
      };
      await this.projectReportService.createEventReportFolder(
        projectSlug,
        eventId
      );
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
