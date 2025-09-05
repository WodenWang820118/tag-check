import { Injectable, Logger } from '@nestjs/common';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { join } from 'path';
import {
  ProjectEventsBuilderService,
  BuildEventInput
} from '../project-agent/project-events-builder/project-events-builder.service';
import { GTMConfiguration, TagConfig, TriggerConfig, Parameter } from '@utils';

@Injectable()
export class GtmParserService {
  private readonly logger = new Logger(GtmParserService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly fileService: FileService,
    private readonly projectEventsBuilderService: ProjectEventsBuilderService
  ) {}

  // Note: We could enhance this to detect duplicate tag names and add serial numbers.
  // For now, we simply save and build from the provided GTM JSON.
  async uploadGtmJson(projectSlug: string, json: unknown) {
    try {
      const hasContainerVersion = (obj: unknown): obj is GTMConfiguration =>
        typeof obj === 'object' && obj !== null && 'containerVersion' in obj;

      // Normalize input to a proper object; callers may send a stringified JSON
      let gtmObject: GTMConfiguration;
      try {
        gtmObject =
          typeof json === 'string'
            ? (JSON.parse(json) as GTMConfiguration)
            : (json as GTMConfiguration);
      } catch (e) {
        this.logger.warn(
          'Received invalid JSON payload; will attempt to continue using saved file. Error: ' +
            (e instanceof Error ? e.message : String(e))
        );
        // Fallback to an empty object; we will read from file after save
        gtmObject = {} as GTMConfiguration;
      }

      const folderPath =
        await this.folderPathService.getProjectConfigFolderPath(projectSlug);
      this.logger.log(`GTM JSON uploaded for project: ${projectSlug}`);
      const filePath = join(folderPath, 'gtm-container.json');
      // Always write a well-formed object to disk when available
      this.fileService.writeJsonFile(filePath, gtmObject);

      // Try to parse and build events immediately
      try {
        // Prefer the normalized object; if it's missing required fields, re-read from disk
        const fromDisk =
          this.fileService.readJsonFile<GTMConfiguration>(filePath);
        const gtm: GTMConfiguration = hasContainerVersion(gtmObject)
          ? gtmObject
          : fromDisk;

        const tags = gtm.containerVersion?.tag ?? [];
        const triggers = gtm.containerVersion?.trigger ?? [];

        const inputs: BuildEventInput[] = tags
          .map((t) => this.toBuildInput(t, triggers))
          .filter((i): i is BuildEventInput => !!i);

        this.logger.log(`Parsed ${inputs.length} events from GTM JSON`);

        if (inputs.length > 0) {
          await this.projectEventsBuilderService.buildEvents(
            projectSlug,
            inputs
          );
        } else {
          this.logger.warn(
            'No event tags with eventName found in uploaded GTM JSON'
          );
        }
      } catch (e) {
        this.logger.warn(
          'Uploaded JSON saved but failed to build events: ' +
            (e instanceof Error ? e.message : String(e))
        );
      }

      return { saved: true };
    } catch (error) {
      this.logger.error(
        `Failed to upload GTM JSON for project: ${projectSlug}`,
        error
      );
      throw error;
    }
  }

  private toBuildInput(
    tag: TagConfig,
    allTriggers: TriggerConfig[]
  ): BuildEventInput | null {
    const eventNameParam = tag.parameter?.find(
      (p: Parameter) => p?.key === 'eventName' && typeof p.value === 'string'
    )?.value as string | undefined;

    if (!eventNameParam) return null;

    const firingTriggerIds = (tag.firingTriggerId ?? []) as string[];
    const tagTriggers = allTriggers.filter((tr) =>
      tr.triggerId ? firingTriggerIds.includes(tr.triggerId) : false
    );

    const spec = {
      tag,
      trigger: tagTriggers
    };

    return {
      eventName: eventNameParam,
      testName: tag.name,
      recording: { title: eventNameParam, steps: [] },
      spec
    };
  }
}
