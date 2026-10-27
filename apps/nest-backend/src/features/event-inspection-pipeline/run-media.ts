import { randomUUID } from 'node:crypto';
import type { RunMediaTimeline } from '@utils';
import type { RunRecorder } from '../web-agent/puppeteer-utils/run-recorder';

/**
 * A run's screen recordings: the folder they go to (`recordingKey`, chosen
 * before the run's result row exists) and their recorders, which the run's
 * caller starts and stops. The pipeline saves the key and the timeline
 * with the run's result.
 */
export class RunMedia {
  readonly recordingKey: string = randomUUID();
  site: RunRecorder | null = null;
  tagAssistant: RunRecorder | null = null;
}

/**
 * Places each step's action time on the site recording, whose 0:00 is its
 * first frame (`siteStart`, epoch ms), and the Tag Assistant recording's
 * start relative to it. Null without a site recording that captured a frame.
 * A step that acted before the first frame is placed at 0:00.
 */
export function buildMediaTimeline(
  stepTimes: readonly (number | undefined)[],
  siteStart: number | null,
  tagAssistantStart: number | null
): RunMediaTimeline | null {
  if (siteStart === null) {
    return null;
  }
  const steps: RunMediaTimeline['steps'] = [];
  stepTimes.forEach((at, index) => {
    if (at !== undefined) {
      steps.push({ index, atMs: Math.max(0, Math.round(at - siteStart)) });
    }
  });
  return {
    steps,
    tagAssistantOffsetMs:
      tagAssistantStart === null
        ? null
        : Math.round(tagAssistantStart - siteStart)
  };
}
