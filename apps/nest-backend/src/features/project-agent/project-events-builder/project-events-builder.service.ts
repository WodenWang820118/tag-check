import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IReportDetails,
  Recording,
  Spec,
  StrictDataLayerEvent,
  ItemDef,
  VariableConfig
} from '@utils';
import { CreateFullTestEventDto } from '../../../shared';
import { ProjectReportService } from '../project-report/project-report.service';
import { TestReportFacadeRepositoryService } from '../../repository/test-report-facade/test-report-facade-repository.service';
import { ProjectRecordingService } from '../project-recording/project-recording.service';
import { ProjectDataLayerSpecBuilderService } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { ProjectGtmContainerService } from '../project-gtm-container/project-gtm-container.service';

export type BuildEventInput = {
  eventName: string;
  testName: string;
  recording: Recording;
  spec: Spec;
  fullItemDef?: ItemDef;
};

export interface BuildEventsResult {
  created: string[];
  updated: string[];
  unchanged: string[];
}

@Injectable()
export class ProjectEventsBuilderService {
  private readonly logger = new Logger(ProjectEventsBuilderService.name);

  constructor(
    private readonly projectReportService: ProjectReportService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly projectRecordingService: ProjectRecordingService,
    private readonly dataLayerSpecBuilderService: ProjectDataLayerSpecBuilderService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly projectGtmContainerService: ProjectGtmContainerService
  ) {}

  /**
   * Creates a test event for each input. An input whose tag already has a test
   * event (same test name and event name) is not duplicated: its spec is
   * refreshed when it is still the generated one, and kept when it was edited.
   */
  async buildEvents(
    projectSlug: string,
    inputs: BuildEventInput[],
    variables: readonly VariableConfig[] = []
  ): Promise<BuildEventsResult> {
    const result: BuildEventsResult = {
      created: [],
      updated: [],
      unchanged: []
    };
    if (inputs.length === 0) {
      return result;
    }
    const existingEvents =
      await this.testEventRepositoryService.listFileReports(projectSlug);

    for (const input of inputs) {
      const dataLayerSpec = this.dataLayerSpecBuilderService.buildDataLayerSpec(
        input.spec,
        variables
      );
      const existing = existingEvents.find(
        (event) =>
          event.testName === input.testName &&
          event.eventName === input.eventName
      );

      if (!existing) {
        await this.createEvent(projectSlug, input, dataLayerSpec);
        result.created.push(input.testName);
        continue;
      }

      const stored = existing.spec;
      const isGenerated =
        this.dataLayerSpecBuilderService.isGeneratedDataLayerSpec(
          stored?.dataLayerSpec,
          stored?.rawGtmTag,
          variables
        );
      if (!stored || !isGenerated) {
        result.unchanged.push(input.testName);
        continue;
      }
      await this.specRepositoryService.update(projectSlug, existing.eventId, {
        event: input.eventName,
        dataLayerSpec,
        rawGtmTag: input.spec
      });
      result.updated.push(input.testName);
    }
    return result;
  }

  /**
   * Returns the spec to validate an event against. A stored spec that is still
   * exactly what the pre-variable builder generated is rebuilt from the
   * project's saved container and persisted, so old imports stop requiring
   * parameters that never came from the data layer.
   */
  async refreshGeneratedSpec(
    projectSlug: string,
    eventId: string,
    stored: { dataLayerSpec?: StrictDataLayerEvent; rawGtmTag?: Spec }
  ): Promise<StrictDataLayerEvent | undefined> {
    if (!stored.dataLayerSpec || !stored.rawGtmTag) {
      return stored.dataLayerSpec;
    }
    const container = await this.projectGtmContainerService.read(projectSlug);
    const upgraded =
      this.dataLayerSpecBuilderService.upgradeLegacyDataLayerSpec(
        stored.dataLayerSpec,
        stored.rawGtmTag,
        [
          ...(container?.containerVersion.variable ?? []),
          ...(container?.containerVersion.builtInVariable ?? [])
        ]
      );
    if (!upgraded) {
      return stored.dataLayerSpec;
    }
    await this.specRepositoryService.update(projectSlug, eventId, {
      event: upgraded.event,
      dataLayerSpec: upgraded
    });
    this.logger.log(
      `Rebuilt the generated spec of ${eventId} from the GTM container's data layer variables`
    );
    return upgraded;
  }

  private async createEvent(
    projectSlug: string,
    { eventName, testName, recording, spec, fullItemDef }: BuildEventInput,
    dataLayerSpec: StrictDataLayerEvent
  ): Promise<void> {
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
      createdAt: new Date()
    };

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
