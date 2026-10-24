import { Injectable, Logger } from '@nestjs/common';
import { VariableConfig } from '@utils';
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
    await this.projectEventsBuilderService.buildEvents(projectSlug, inputs, [
      ...variable,
      ...builtInVariable
    ] as VariableConfig[]);
  }
}
