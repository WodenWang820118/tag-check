import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ProjectEventsBuilderService,
  BuildEventInput,
  throwIfGtmImportUnresolved
} from '../project-agent/project-events-builder/project-events-builder.service';
import { ProjectGtmContainerService } from '../project-agent/project-gtm-container/project-gtm-container.service';
import {
  GTMConfiguration,
  GtmImportPreview,
  GtmImportResolution,
  GtmImportSummary,
  TagConfig,
  TagTypeEnum,
  TriggerConfig,
  VariableConfig,
  getGa4EventNameIssues,
  getParameterValue,
  parseGtmContainerExport
} from '@utils';

type TagImport =
  | { input: BuildEventInput }
  | { skipped: GtmImportSummary['skipped'][number] };

type UploadBody = {
  container: GTMConfiguration;
  resolutions: Record<string, GtmImportResolution>;
};

/** Turns a GTM container export into a project's tests. */
@Injectable()
export class GtmParserService {
  private readonly logger = new Logger(GtmParserService.name);
  constructor(
    private readonly projectGtmContainerService: ProjectGtmContainerService,
    private readonly projectEventsBuilderService: ProjectEventsBuilderService
  ) {}

  /**
   * Reports tags whose name already has a test but whose event name changed.
   * Takes the same body as upload. Writes nothing: no rows, no files and no
   * saved container.
   */
  async previewGtmJson(
    projectSlug: string,
    payload: unknown
  ): Promise<GtmImportPreview> {
    const { inputs, variables } = this.plan(payload);
    const conflicts =
      await this.projectEventsBuilderService.findImportConflicts(
        projectSlug,
        inputs,
        variables
      );
    return { conflicts };
  }

  /**
   * Saves a Tag Manager container export as the project's container and turns
   * each GA4 event tag into a test. The body is the container, its text, or
   * `{ container, resolutions }` after the user has chosen what to do with a
   * tag whose event name changed. A conflict with no resolution is a 409 and
   * writes nothing. Re-importing the same event name refreshes a generated
   * spec instead of duplicating the test.
   */
  async uploadGtmJson(
    projectSlug: string,
    payload: unknown
  ): Promise<GtmImportSummary> {
    const { container, resolutions, inputs, skipped, variables } =
      this.plan(payload);
    const conflicts =
      await this.projectEventsBuilderService.findImportConflicts(
        projectSlug,
        inputs,
        variables
      );
    throwIfGtmImportUnresolved(conflicts, resolutions);

    await this.projectGtmContainerService.save(projectSlug, container);
    const result = await this.projectEventsBuilderService.buildEvents(
      projectSlug,
      inputs,
      variables,
      resolutions
    );

    this.logger.log(
      `Imported GTM container for ${projectSlug}: ${result.created.length} created, ${result.updated.length} updated, ${result.unchanged.length} unchanged, ${result.renamed.length} renamed, ${result.keptBoth.length} kept both, ${skipped.length} skipped`
    );
    return { saved: true, ...result, skipped };
  }

  /**
   * A GA4 event tag with a literal, valid event name becomes a test input
   * with its firing triggers. A paused tag does not fire on the site, so it
   * is skipped with the other tags that cannot become a test.
   */
  private toTagImport(tag: TagConfig, container: GTMConfiguration): TagImport {
    if (tag.type !== TagTypeEnum.GAAWE) {
      return { skipped: { tagName: tag.name, reason: 'Not a GA4 event tag' } };
    }
    if (tag.paused) {
      this.logger.log(`Skipping paused tag "${tag.name}"`);
      return { skipped: { tagName: tag.name, reason: 'Paused' } };
    }
    const eventName = getParameterValue(tag.parameter, 'eventName')?.trim();
    if (!eventName) {
      return { skipped: { tagName: tag.name, reason: 'No event name' } };
    }
    if (eventName.includes('{{')) {
      return {
        skipped: {
          tagName: tag.name,
          reason: `The event name ${eventName} is only known at runtime`
        }
      };
    }
    const issues = getGa4EventNameIssues(eventName);
    if (issues.length > 0) {
      return {
        skipped: {
          tagName: tag.name,
          reason: `GA4 event names ${issues.join(' and ')} (https://support.google.com/analytics/answer/13316687)`
        }
      };
    }

    const firingTriggerIds = new Set(tag.firingTriggerId ?? []);
    const trigger = container.containerVersion.trigger.filter(
      (candidate: TriggerConfig) =>
        candidate.triggerId !== undefined &&
        firingTriggerIds.has(candidate.triggerId)
    );
    return {
      input: {
        eventName,
        testName: tag.name,
        recording: { title: eventName, steps: [] },
        spec: { tag, trigger }
      }
    };
  }

  private plan(payload: unknown): UploadBody & {
    inputs: BuildEventInput[];
    skipped: GtmImportSummary['skipped'];
    variables: VariableConfig[];
  } {
    const { containerPayload, resolutions } = readUploadBody(payload);
    const { container, error } = parseGtmContainerExport(containerPayload);
    if (!container) {
      throw new BadRequestException(error);
    }
    const imports = container.containerVersion.tag.map((tag) =>
      this.toTagImport(tag, container)
    );
    return {
      container,
      resolutions,
      inputs: imports.flatMap((entry) =>
        'input' in entry ? [entry.input] : []
      ),
      skipped: imports.flatMap((entry) =>
        'skipped' in entry ? [entry.skipped] : []
      ),
      variables: [
        ...container.containerVersion.variable,
        ...container.containerVersion.builtInVariable
      ]
    };
  }
}

/**
 * Prefer raw-container interpretation when containerVersion exists so export
 * metadata cannot be mistaken for an upload wrapper.
 */
function readUploadBody(payload: unknown): {
  containerPayload: unknown;
  resolutions: Record<string, GtmImportResolution>;
} {
  if (!isRecord(payload) || !isResolutionBody(payload)) {
    return { containerPayload: payload, resolutions: {} };
  }
  if (!isResolutionRecord(payload.resolutions)) {
    throw new BadRequestException(
      'resolutions must map each tag name to "update" or "keepBoth".'
    );
  }
  return {
    containerPayload: payload.container,
    resolutions: payload.resolutions
  };
}

function isResolutionBody(payload: Record<string, unknown>): payload is Record<
  string,
  unknown
> & {
  container: unknown;
  resolutions: unknown;
} {
  return (
    'container' in payload &&
    'resolutions' in payload &&
    !('containerVersion' in payload)
  );
}

function isResolutionRecord(
  value: unknown
): value is Record<string, GtmImportResolution> {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(
    (entry) => entry === 'update' || entry === 'keepBoth'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
