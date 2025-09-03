import { Injectable, Logger } from '@nestjs/common';
import { events } from './events/events';
import {
  ProjectEventsBuilderService,
  BuildEventInput
} from '../project-agent/project-events-builder/project-events-builder.service';

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
    await this.projectEventsBuilderService.buildEvents(projectSlug, inputs);
  }
}
