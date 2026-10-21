import { Injectable, Logger } from '@nestjs/common';
import type { Step } from '@utils';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { ProjectRecordingService } from '../project-agent/project-recording/project-recording.service';
import { events } from './events/events';

/**
 * Every selector the example project's recordings clicked before they moved
 * to data-testid hooks. The demo site no longer has that PrimeNG markup.
 */
export const SHIPPED_LEGACY_SELECTORS: ReadonlySet<string> = new Set([
  '#viewDestination span',
  'button.relative',
  'button.relative > span.p-button-label',
  'div.p-carousel-item-end img',
  'div:nth-of-type(5) img',
  'div:nth-of-type(8) img',
  'div:nth-of-type(9) img',
  'main button',
  'main button:nth-of-type(1) > span',
  'main button:nth-of-type(2)',
  'main div > button',
  'main span',
  'main span.p-button-label',
  'tfoot button'
]);

/**
 * True when every click in the recording uses a selector the example project
 * shipped with, so the user has not edited it.
 */
export function isShippedLegacyRecording(steps: readonly Step[]): boolean {
  const clicks = steps.filter((step) => step.type === 'click');
  return (
    clicks.length > 0 &&
    clicks.every((step) =>
      (step.selectors ?? [])
        .flat()
        .every((selector) => SHIPPED_LEGACY_SELECTORS.has(selector))
    )
  );
}

/**
 * The example project is seeded only on a fresh install, so existing installs
 * keep recordings that no longer replay against the demo site. This replaces
 * those shipped recordings with the current ones and leaves edited ones alone.
 */
@Injectable()
export class ExampleRecordingsRefreshService {
  private readonly logger = new Logger(ExampleRecordingsRefreshService.name);

  constructor(
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly projectRecordingService: ProjectRecordingService
  ) {}

  /** Returns the names of the events whose recordings were replaced. */
  async refresh(projectSlug: string): Promise<string[]> {
    const currentRecordings = new Map(
      Object.values(events).map((example) => [
        example.eventName,
        example.recording
      ])
    );
    const testEvents =
      await this.testEventRepositoryService.listWithRecordings(projectSlug);
    const refreshed: string[] = [];

    for (const testEvent of testEvents) {
      const recording = currentRecordings.get(testEvent.eventName);
      const steps = testEvent.recording?.steps;
      if (
        !recording ||
        !Array.isArray(steps) ||
        !isShippedLegacyRecording(steps)
      ) {
        continue;
      }

      await this.recordingRepositoryService.update(
        projectSlug,
        testEvent.eventId,
        { title: recording.title, steps: recording.steps }
      );
      await this.projectRecordingService.updateRecording(
        projectSlug,
        testEvent.eventId,
        recording
      );
      refreshed.push(testEvent.eventName);
    }

    if (refreshed.length > 0) {
      this.logger.log(
        `Refreshed example recordings for ${refreshed.join(', ')}`
      );
    }
    return refreshed;
  }
}
