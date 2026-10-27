import { Page } from 'puppeteer';
import { Step } from '@utils';
import { targetFrame, type QueryRoot } from './frame';

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
 * One Chrome Recorder selector alternative, as one Puppeteer selector.
 *
 * A string, or an array of one part, is returned as recorded, so `aria/…`,
 * `text/…`, `xpath/…`, `pierce/…`, CSS and the legacy `aria/aria-label/…`
 * form keep the spellings the rest of the replay already understands. An
 * array of two or more parts is a shadow-DOM chain: each part is queried
 * inside the open shadow root of the element the previous part matched, or
 * in that element when it has no shadow root. Puppeteer writes that with
 * the ` >>>> ` combinator (the deep child; `>>>` searches every nested
 * root). Prefixed parts become P-selector pseudo-elements so they can sit
 * in that combinator: `aria/X` to `::-p-aria(X)`, `text/X` to `::-p-text(X)`,
 * `xpath/X` to `::-p-xpath(X)`.
 *
 * `pierce/` cannot be one part of a selector. It is prefixed notation for a
 * whole query, and Puppeteer documents it as the deep combinator
 * (`pierce/div` is the same query as `& >>> div`). Two deep combinators in
 * a row are a syntax error, so a pierce part is written `:scope >>> css`:
 * the selector engine treats `:scope` before a combinator as the current
 * node, which is what lets `>>>` apply inside the chain.
 *
 * An argument that contains parentheses, quotes, commas or backslashes is
 * quoted. Puppeteer accepts a CSS string, for example `::-p-text("a (b)")`.
 *
 * @see https://pptr.dev/guides/page-interactions#querying-elements
 */
export function toPuppeteerSelector(selectorGroup: string | string[]): string {
  const parts = Array.isArray(selectorGroup) ? selectorGroup : [selectorGroup];
  if (parts.length <= 1) {
    return parts[0] ?? '';
  }
  let selector = chainPart(parts[0]);
  for (let index = 1; index < parts.length; index++) {
    selector += ` >>>> ${chainPart(parts[index])}`;
  }
  return selector;
}

/** One chain part: a P-selector pseudo, a deep pierce query, or CSS as recorded. */
function chainPart(part: string): string {
  if (part.startsWith('pierce/')) {
    return `:scope >>> ${part.slice('pierce/'.length)}`;
  }
  if (part.startsWith('aria/')) {
    return `::-p-aria(${quotePSelectorArgument(part.slice('aria/'.length))})`;
  }
  if (part.startsWith('text/')) {
    return `::-p-text(${quotePSelectorArgument(part.slice('text/'.length))})`;
  }
  if (part.startsWith('xpath/')) {
    return `::-p-xpath(${quotePSelectorArgument(part.slice('xpath/'.length))})`;
  }
  return part;
}

/**
 * Quotes a P-selector argument the grammar would split. Parentheses end the
 * argument, and a comma or a quote is read as syntax rather than text.
 */
function quotePSelectorArgument(value: string): string {
  if (!/[()"',\\]/.test(value)) {
    return value;
  }
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
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
 * is not reported as "nothing appeared". `page` is the step's frame when the
 * step recorded one, and the page otherwise.
 */
export async function waitForAnySelector(
  page: QueryRoot,
  selectors: string[],
  options: { timeout?: number; visible?: boolean } = {}
): Promise<string | null> {
  if (selectors.length === 0) {
    return null;
  }
  const { timeout = STEP_SELECTOR_TIMEOUT_MS, visible = true } = options;
  const frame = targetFrame(page);
  const controller = new AbortController();
  try {
    return await Promise.any(
      selectors.map((selector) =>
        // Turns a synchronous throw into a rejection Promise.any can see.
        Promise.resolve()
          .then(() =>
            frame.waitForSelector(selector, {
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
