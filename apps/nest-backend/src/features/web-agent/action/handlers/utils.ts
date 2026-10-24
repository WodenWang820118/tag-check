import { Page } from 'puppeteer';
import { Step } from '@utils';

/**
 * Replays one click, change or hover step. Resolves once the action was
 * performed with one of the step's selectors; throws when none worked.
 */
export interface ActionHandler {
  handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: Step,
    isLastClick: boolean
  ): Promise<void>;
}

/** Injection token of the step type to ActionHandler map. */
export const ACTION_HANDLERS = 'ACTION_HANDLERS';

/**
 * Chrome Recorder stores each selector as a group: a chain for nested
 * frames or shadow roots. Only the group's first selector is replayed.
 */
export function getFirstSelector(selectorGroup: string | string[]): string {
  return Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
}

/**
 * How long a step waits for any of its selectors, unless the recording sets
 * the step's own timeout. Pages replayed through GTM Preview can take several
 * seconds to render again after the pre-loading values reload them.
 */
export const STEP_SELECTOR_TIMEOUT_MS = 15_000;

/** Errors that mean "did not appear in time", as opposed to a broken wait. */
function isTimeoutOrAbort(error: unknown): boolean {
  const name = (error as { name?: unknown } | null)?.name;
  return name === 'TimeoutError' || name === 'AbortError';
}

/**
 * Waits for whichever selector appears first, under one shared timeout, as
 * Chrome Recorder's own replay does. Waiting for each selector in turn with a
 * short timeout gave up on slow pages.
 *
 * Resolves that selector, or null when none appears in time. Any other
 * failure, such as a detached frame or an invalid selector, is rethrown so it
 * is not reported as "nothing appeared".
 */
export async function waitForAnySelector(
  page: Page,
  selectors: string[],
  options: { timeout?: number; visible?: boolean } = {}
): Promise<string | null> {
  if (selectors.length === 0) {
    return null;
  }
  const { timeout = STEP_SELECTOR_TIMEOUT_MS, visible = true } = options;
  const controller = new AbortController();
  try {
    return await Promise.any(
      selectors.map((selector) =>
        // Turns a synchronous throw into a rejection Promise.any can see.
        Promise.resolve()
          .then(() =>
            page.waitForSelector(selector, {
              timeout,
              visible,
              signal: controller.signal
            })
          )
          .then(async (handle) => {
            // The handle would keep the node alive until the page navigates.
            await handle?.dispose();
            return selector;
          })
      )
    );
  } catch (error) {
    const failures = error instanceof AggregateError ? error.errors : [error];
    const broken = failures.find((failure) => !isTimeoutOrAbort(failure));
    if (broken) {
      throw broken;
    }
    return null;
  } finally {
    // Stops the waits that lost the race.
    controller.abort();
  }
}

/** Puts the selector that appeared first ahead of the others. */
export function preferSelector(
  selectors: string[],
  first: string | null
): string[] {
  return first ? [first, ...selectors.filter((s) => s !== first)] : selectors;
}
