import { Page } from 'puppeteer';

export interface ActionHandler {
  handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: any,
    isLastStep: boolean
  ): Promise<void>;
}

export const ACTION_HANDLERS = 'ACTION_HANDLERS';

export function getFirstSelector(selectorGroup: string | string[]): string {
  return Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
}

/**
 * How long a step waits for any of its selectors to become visible. Pages
 * replayed through GTM Preview can take several seconds to render again after
 * the pre-loading values reload them.
 */
export const STEP_SELECTOR_TIMEOUT_MS = 15_000;

/**
 * Waits for whichever selector becomes visible first, under one shared
 * timeout, as Chrome Recorder's own replay does. Waiting for each selector in
 * turn with a short timeout gave up on slow pages. Resolves that selector, or
 * null when none appears in time.
 */
export async function waitForAnySelector(
  page: Page,
  selectors: string[],
  timeout = STEP_SELECTOR_TIMEOUT_MS
): Promise<string | null> {
  if (selectors.length === 0) {
    return null;
  }
  const controller = new AbortController();
  try {
    return await Promise.any(
      selectors.map((selector) =>
        page
          .waitForSelector(selector, {
            timeout,
            visible: true,
            signal: controller.signal
          })
          .then(() => selector)
      )
    );
  } catch {
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
