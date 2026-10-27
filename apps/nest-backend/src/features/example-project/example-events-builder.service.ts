import { Injectable, Logger } from '@nestjs/common';
import { GtmImportResolution, VariableConfig } from '@utils';
import { events } from './events/events';
import { exampleGtmJson } from './gtm-json';
import {
  ProjectEventsBuilderService,
  BuildEventInput
} from '../project-agent/project-events-builder/project-events-builder.service';

/**
 * Creates the example project's tests from its shipped recordings and GTM
 * container.
 */
@Injectable()
export class ExampleEventsBuilderService {
  private readonly logger = new Logger(ExampleEventsBuilderService.name);

  constructor(
    private readonly projectEventsBuilderService: ProjectEventsBuilderService
  ) {}

  // Using GTM JSON object from example files to build events
  async buildEvents(projectSlug: string): Promise<void> {
    this.logger.debug(`Building example events for project=${projectSlug}`);
    const inputs: BuildEventInput[] = Object.values(events).map(
      ({ eventName, testName, recording, spec, fullItemDef }) => ({
        eventName,
        testName,
        recording,
        spec,
        fullItemDef
      })
    );
    const { variable, builtInVariable } = exampleGtmJson.containerVersion;
    // Seeding has no one to ask. A tag whose event name changed updates
    // the existing test instead of failing the import.
    const resolutions: Record<string, GtmImportResolution> = {};
    for (const input of inputs) {
      resolutions[input.testName] = 'update';
    }
    await this.projectEventsBuilderService.buildEvents(
      projectSlug,
      inputs,
      [...variable, ...builtInVariable] as VariableConfig[],
      resolutions
    );
  }
}
