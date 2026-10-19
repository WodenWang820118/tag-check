import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ProjectEventsBuilderService,
  BuildEventInput
} from '../project-agent/project-events-builder/project-events-builder.service';
import { ProjectGtmContainerService } from '../project-agent/project-gtm-container/project-gtm-container.service';
import {
  GTMConfiguration,
  GtmImportSummary,
  TagConfig,
  TagTypeEnum,
  TriggerConfig,
  getGa4EventNameIssues,
  getParameterValue,
  parseGtmContainerExport
} from '@utils';

type TagImport =
  | { input: BuildEventInput }
  | { skipped: GtmImportSummary['skipped'][number] };

@Injectable()
export class GtmParserService {
  private readonly logger = new Logger(GtmParserService.name);
  constructor(
    private readonly projectGtmContainerService: ProjectGtmContainerService,
    private readonly projectEventsBuilderService: ProjectEventsBuilderService
  ) {}

  /**
   * Saves a Tag Manager container export as the project's container and turns
   * each GA4 event tag into a test event. Re-importing the same container
   * refreshes generated specs instead of duplicating events.
   */
  async uploadGtmJson(
    projectSlug: string,
    payload: unknown
  ): Promise<GtmImportSummary> {
    const { container, error } = parseGtmContainerExport(payload);
    if (!container) {
      throw new BadRequestException(error);
    }
    await this.projectGtmContainerService.save(projectSlug, container);

    const imports = container.containerVersion.tag.map((tag) =>
      this.toTagImport(tag, container)
    );
    const inputs = imports.flatMap((entry) =>
      'input' in entry ? [entry.input] : []
    );
    const skipped = imports.flatMap((entry) =>
      'skipped' in entry ? [entry.skipped] : []
    );
    const result = await this.projectEventsBuilderService.buildEvents(
      projectSlug,
      inputs,
      [
        ...container.containerVersion.variable,
        ...container.containerVersion.builtInVariable
      ]
    );

    this.logger.log(
      `Imported GTM container for ${projectSlug}: ${result.created.length} created, ${result.updated.length} updated, ${result.unchanged.length} unchanged, ${skipped.length} skipped`
    );
    return { saved: true, ...result, skipped };
  }

  private toTagImport(tag: TagConfig, container: GTMConfiguration): TagImport {
    if (tag.type !== TagTypeEnum.GAAWE) {
      return { skipped: { tagName: tag.name, reason: 'Not a GA4 event tag' } };
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
}
