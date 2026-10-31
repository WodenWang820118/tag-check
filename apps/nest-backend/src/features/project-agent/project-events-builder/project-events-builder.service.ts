import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IReportDetails,
  Recording,
  Spec,
  StrictDataLayerEvent,
  ItemDef,
  VariableConfig,
  GtmImportConflict,
  GtmImportResolution,
  keepBothTestName
} from '@utils';
import { CreateFullTestEventDto, TestEventEntity } from '../../../shared';
import { ProjectReportService } from '../project-report/project-report.service';
import { TestReportFacadeRepositoryService } from '../../repository/test-report-facade/test-report-facade-repository.service';
import { ProjectRecordingService } from '../project-recording/project-recording.service';
import { ProjectDataLayerSpecBuilderService } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { ProjectGtmContainerService } from '../project-gtm-container/project-gtm-container.service';
import {
  findGtmImportConflicts,
  matchImportedEvent,
  type ImportedEventMatch
} from './gtm-import-matching';

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
  renamed: string[];
  keptBoth: { tagName: string; testName: string }[];
}

const IMPORT_CONFLICT_MESSAGE =
  'These tags already have a test with a different event name. Choose update or keep both for each one.';

/**
 * Rejects an import that would change an event name before any row is written.
 * `update` keeps the test and replaces its spec. `keepBoth` adds a new test.
 */
export function throwIfGtmImportUnresolved(
  conflicts: readonly GtmImportConflict[],
  resolutions: Readonly<Record<string, GtmImportResolution>>
): void {
  const unresolved = conflicts.filter(
    (conflict) => !isGtmImportResolution(resolutions[conflict.tagName])
  );
  if (unresolved.length === 0) {
    return;
  }
  throw new ConflictException({
    statusCode: HttpStatus.CONFLICT,
    message: IMPORT_CONFLICT_MESSAGE,
    conflicts: unresolved
  });
}

function isGtmImportResolution(value: unknown): value is GtmImportResolution {
  return value === 'update' || value === 'keepBoth';
}

function emptyBuildResult(): BuildEventsResult {
  return {
    created: [],
    updated: [],
    unchanged: [],
    renamed: [],
    keptBoth: []
  };
}

/**
 * Creates a project's tests from GTM tags, each with its recording, spec and
 * item definition, and refreshes specs that are still generated.
 */
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
   * Tags whose name already has a test with a different event name. Reads
   * tests and writes nothing. A test with the same name and the same event
   * name is not a conflict.
   */
  async findImportConflicts(
    projectSlug: string,
    inputs: BuildEventInput[],
    variables: readonly VariableConfig[] = []
  ): Promise<GtmImportConflict[]> {
    if (inputs.length === 0) {
      return [];
    }
    const existingEvents =
      await this.testEventRepositoryService.listWithSpecs(projectSlug);
    return this.conflictsAmong(existingEvents, inputs, variables);
  }

  /**
   * Creates a test for each input. A tag name that already has a test with
   * the same event name is not duplicated: a generated spec is refreshed and
   * an edited one is kept. A tag name whose event name changed is a conflict.
   * `update` gives that test the new event name and the container's spec,
   * and keeps its recording, item definition and runs. `keepBoth` adds a new
   * test named with the lowest free "Name (n)" suffix. A conflict with no
   * resolution throws 409 before anything is written. Callers that are not
   * asking a user, such as the example project, pass `update` for every input.
   */
  async buildEvents(
    projectSlug: string,
    inputs: BuildEventInput[],
    variables: readonly VariableConfig[] = [],
    resolutions: Readonly<Record<string, GtmImportResolution>> = {}
  ): Promise<BuildEventsResult> {
    const result = emptyBuildResult();
    if (inputs.length === 0) {
      return result;
    }
    const existingEvents =
      await this.testEventRepositoryService.listWithSpecs(projectSlug);
    throwIfGtmImportUnresolved(
      this.conflictsAmong(existingEvents, inputs, variables),
      resolutions
    );

    // Names already used, plus names this import assigns, so a later
    // "keep both" does not reuse one.
    const taken = new Set(existingEvents.map((event) => event.testName));

    // Sequential on purpose: each input writes rows and files, and the
    // result lists the inputs in order.
    for (const input of inputs) {
      const dataLayerSpec = this.dataLayerSpecBuilderService.buildDataLayerSpec(
        input.spec,
        variables
      );
      const match = this.matchExisting(existingEvents, input);

      if (match.kind === 'same') {
        await this.refreshSameEvent(
          projectSlug,
          match.event,
          input,
          dataLayerSpec,
          variables,
          result
        );
        continue;
      }

      if (match.kind === 'conflict') {
        await this.applyConflict(
          projectSlug,
          match.event,
          input,
          dataLayerSpec,
          variables,
          resolutions,
          taken,
          result
        );
        continue;
      }

      const testName = taken.has(input.testName)
        ? keepBothTestName(input.testName, taken)
        : input.testName;
      taken.add(testName);
      await this.createEvent(
        projectSlug,
        testName === input.testName ? input : { ...input, testName },
        dataLayerSpec
      );
      result.created.push(testName);
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

  private conflictsAmong(
    existingEvents: readonly TestEventEntity[],
    inputs: readonly BuildEventInput[],
    variables: readonly VariableConfig[]
  ): GtmImportConflict[] {
    return findGtmImportConflicts(existingEvents, inputs, (event) =>
      this.specWasEdited(event, variables)
    );
  }

  /**
   * Prefers a test with the same event name when a project already has more
   * than one test under the tag name. Otherwise the first test with that
   * name is the one a conflict asks about.
   */
  private matchExisting(
    existingEvents: readonly TestEventEntity[],
    input: BuildEventInput
  ): ImportedEventMatch<TestEventEntity> {
    return matchImportedEvent(existingEvents, input);
  }

  private specWasEdited(
    event: TestEventEntity,
    variables: readonly VariableConfig[]
  ): boolean {
    const stored = event.spec;
    if (!stored) {
      return false;
    }
    return !this.dataLayerSpecBuilderService.isGeneratedDataLayerSpec(
      stored.dataLayerSpec,
      stored.rawGtmTag,
      variables
    );
  }

  private async refreshSameEvent(
    projectSlug: string,
    existing: TestEventEntity,
    input: BuildEventInput,
    dataLayerSpec: StrictDataLayerEvent,
    variables: readonly VariableConfig[],
    result: BuildEventsResult
  ): Promise<void> {
    const stored = existing.spec;
    const isGenerated =
      this.dataLayerSpecBuilderService.isGeneratedDataLayerSpec(
        stored?.dataLayerSpec,
        stored?.rawGtmTag,
        variables
      );
    if (!stored || !isGenerated) {
      result.unchanged.push(input.testName);
      return;
    }
    await this.specRepositoryService.update(projectSlug, existing.eventId, {
      event: input.eventName,
      dataLayerSpec,
      rawGtmTag: input.spec
    });
    result.updated.push(input.testName);
  }

  private async applyConflict(
    projectSlug: string,
    existing: TestEventEntity,
    input: BuildEventInput,
    dataLayerSpec: StrictDataLayerEvent,
    variables: readonly VariableConfig[],
    resolutions: Readonly<Record<string, GtmImportResolution>>,
    taken: Set<string>,
    result: BuildEventsResult
  ): Promise<void> {
    const resolution = resolutions[input.testName];
    if (resolution !== 'update' && resolution !== 'keepBoth') {
      throwIfGtmImportUnresolved(
        [
          {
            tagName: input.testName,
            existingEventName: existing.eventName,
            newEventName: input.eventName,
            specEdited: this.specWasEdited(existing, variables)
          }
        ],
        {}
      );
      return;
    }
    if (resolution === 'update') {
      // The event changed, so the spec is replaced even when it was edited.
      // The recording, item definition and runs stay on this event id.
      await this.testEventRepositoryService.update(existing.id, {
        eventName: input.eventName
      });
      await this.specRepositoryService.update(projectSlug, existing.eventId, {
        event: input.eventName,
        dataLayerSpec,
        rawGtmTag: input.spec
      });
      result.renamed.push(input.testName);
      return;
    }
    const testName = keepBothTestName(input.testName, taken);
    taken.add(testName);
    await this.createEvent(projectSlug, { ...input, testName }, dataLayerSpec);
    result.keptBoth.push({ tagName: input.testName, testName });
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
