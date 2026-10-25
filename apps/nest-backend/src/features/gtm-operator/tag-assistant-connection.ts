import type { Page } from 'puppeteer';

/**
 * The controls of Tag Assistant (tagassistant.google.com) that GTM Preview
 * goes through. Class names, not texts: Tag Assistant follows the browser's
 * language.
 */
export const TAG_ASSISTANT_SELECTORS = {
  /** "Include debug signal in the URL", in the connect dialog. */
  includeDebugParam: '#include-debug-param',
  /** The connect dialog's Connect button, which opens the site's window. */
  startButton: '#domain-start-button',
  /** The "Connected!" dialog's Continue button. */
  continueButton: '.btn.btn--filled.wd-continue-debugging-button',
  /** The "Could not connect" dialog's Retry button. */
  retryButton:
    '.not-connected__retry button:not(.wd-continue-debugging-button)',
  /** The debugger header's "Connected" label. */
  connectedHeader: '.debugger-header__connected'
} as const;

/** What Tag Assistant shows while it connects to the site's window. */
export interface TagAssistantView {
  /** The "Connected!" dialog is open, with its Continue button. */
  continueVisible: boolean;
  /** The debugger header says Connected. */
  connected: boolean;
  /** The "Could not connect" dialog is open, with its Retry button. */
  retryVisible: boolean;
  /** The text of the connection dialog, for the log. */
  message: string;
}

/**
 * Reads the TagAssistantView as JSON. Source text, because the ES5 bundle
 * would add swc helpers to a function that the page lacks.
 */
export const READ_TAG_ASSISTANT_VIEW = `(function () {
  function visible(selector) {
    var element = document.querySelector(selector);
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
  var dialog = document.querySelector('.not-connected__errors') ||
    document.querySelector('.ctui-dialog');
  return JSON.stringify({
    continueVisible: visible(${JSON.stringify(TAG_ASSISTANT_SELECTORS.continueButton)}),
    connected: !!document.querySelector(${JSON.stringify(TAG_ASSISTANT_SELECTORS.connectedHeader)}),
    retryVisible: visible(${JSON.stringify(TAG_ASSISTANT_SELECTORS.retryButton)}),
    message: dialog ? String(dialog.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 300) : ''
  });
})()`;

/** Sets the include-debug-param checkbox; returns whether it was checked. */
export const CHECK_INCLUDE_DEBUG_PARAM = `(function () {
  var checkbox = document.querySelector(${JSON.stringify(TAG_ASSISTANT_SELECTORS.includeDebugParam)});
  if (!checkbox) return false;
  var wasChecked = !!checkbox.checked;
  if (!wasChecked) checkbox.click();
  return wasChecked;
})()`;

/** Reads READ_TAG_ASSISTANT_VIEW's result; anything unreadable is an empty view. */
export function parseTagAssistantView(raw: unknown): TagAssistantView {
  const empty: TagAssistantView = {
    continueVisible: false,
    connected: false,
    retryVisible: false,
    message: ''
  };
  if (typeof raw !== 'string') {
    return empty;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return empty;
    }
    const message: unknown = Reflect.get(value, 'message');
    return {
      continueVisible: Reflect.get(value, 'continueVisible') === true,
      connected: Reflect.get(value, 'connected') === true,
      retryVisible: Reflect.get(value, 'retryVisible') === true,
      message: typeof message === 'string' ? message : ''
    };
  } catch {
    return empty;
  }
}

/** What to do next while Tag Assistant connects. */
export type ConnectionStep =
  /** Click Continue in the "Connected!" dialog. */
  | { kind: 'continue' }
  /** Connected, and no dialog is in the way. */
  | { kind: 'connected' }
  /** Tag Assistant could not connect: click Retry and connect again. */
  | { kind: 'retry' }
  /** Give up: Tag Assistant could not connect, or gave no answer in time. */
  | { kind: 'fail'; reason: 'not-connected' | 'no-answer' }
  /** Still connecting: look again. */
  | { kind: 'wait' };

/**
 * Decides the next step from what Tag Assistant shows. The Continue button
 * comes first: Tag Assistant shows the "Connected!" dialog over a header that
 * already says Connected. A header that says Connected without the dialog is
 * connected too. A "Could not connect" dialog is retried until the attempts
 * run out. Without any of these, the run waits until `timedOut`.
 */
export function decideConnectionStep(
  view: TagAssistantView,
  progress: { attempt: number; maxAttempts: number; timedOut: boolean }
): ConnectionStep {
  if (view.continueVisible) {
    return { kind: 'continue' };
  }
  if (view.connected) {
    return { kind: 'connected' };
  }
  if (view.retryVisible) {
    return progress.attempt < progress.maxAttempts
      ? { kind: 'retry' }
      : { kind: 'fail', reason: 'not-connected' };
  }
  return progress.timedOut
    ? { kind: 'fail', reason: 'no-answer' }
    : { kind: 'wait' };
}

/**
 * GTM Preview did not connect. `clientMessage` is what the user sees; the
 * error's message adds the technical detail for the log.
 */
export class GtmPreviewConnectionError extends Error {
  constructor(
    readonly clientMessage: string,
    detail: string
  ) {
    super(`${clientMessage}. ${detail}`);
    this.name = 'GtmPreviewConnectionError';
  }
}

export interface ConnectTagAssistantOptions {
  /** The site's origin: its windows from a failed attempt are closed. */
  siteOrigin: string;
  /**
   * How long one attempt waits for Tag Assistant's answer. Tag Assistant
   * gives up on a site about 30 seconds after opening it and says so, so
   * this waits longer than that to read its answer.
   */
  attemptTimeoutMs?: number;
  /** Attempts in all, the first one included. */
  maxAttempts?: number;
  pollIntervalMs?: number;
  /** How long a required control (Connect, Retry) may take to appear. */
  controlTimeoutMs?: number;
  log?: (message: string) => void;
  /** Receives a failed attempt that is retried. */
  warn?: (message: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const DEFAULT_ATTEMPT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_POLL_INTERVAL_MS = 250;
const DEFAULT_CONTROL_TIMEOUT_MS = 30_000;

function siteName(siteOrigin: string): string {
  try {
    return new URL(siteOrigin).host || siteOrigin;
  } catch {
    return siteOrigin;
  }
}

/**
 * Connects Tag Assistant, already open on its connect dialog, to the site:
 * keeps the debug signal in the site's URL, clicks Connect, and waits until
 * Tag Assistant says it is connected, clicking Continue in its "Connected!"
 * dialog. When Tag Assistant says it could not connect, the site's window is
 * closed and the connection is tried again, up to `maxAttempts` times.
 *
 * Resolves once Tag Assistant is connected. Rejects with
 * GtmPreviewConnectionError otherwise.
 */
export async function connectTagAssistant(
  page: Page,
  options: ConnectTagAssistantOptions
): Promise<void> {
  const attemptTimeoutMs =
    options.attemptTimeoutMs ?? DEFAULT_ATTEMPT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const controlTimeoutMs =
    options.controlTimeoutMs ?? DEFAULT_CONTROL_TIMEOUT_MS;
  const log = options.log ?? (() => undefined);
  const warn = options.warn ?? log;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = options.now ?? (() => Date.now());
  const site = siteName(options.siteOrigin);

  for (let attempt = 1; ; attempt++) {
    await clickStart(page, controlTimeoutMs);
    const startedAt = now();
    let view = await readView(page);
    let step = decideConnectionStep(view, {
      attempt,
      maxAttempts,
      timedOut: false
    });
    while (step.kind === 'wait') {
      await sleep(pollIntervalMs);
      view = await readView(page);
      step = decideConnectionStep(view, {
        attempt,
        maxAttempts,
        timedOut: now() - startedAt >= attemptTimeoutMs
      });
    }

    switch (step.kind) {
      case 'continue':
        try {
          await page.click(TAG_ASSISTANT_SELECTORS.continueButton);
        } catch (error) {
          // The dialog closed between the read and the click: connected
          // all the same when the header says so.
          if (!(await readView(page)).connected) {
            throw new GtmPreviewConnectionError(
              'Could not connect to GTM Preview (Tag Assistant did not show the Continue button)',
              `Clicking ${TAG_ASSISTANT_SELECTORS.continueButton}: ${error}`
            );
          }
        }
        log(`Tag Assistant connected to ${site} (attempt ${attempt})`);
        return;
      case 'connected':
        log(
          `Tag Assistant connected to ${site} without its Continue dialog (attempt ${attempt})`
        );
        return;
      case 'retry':
        warn(
          `Tag Assistant could not connect to ${site} (attempt ${attempt} of ${maxAttempts}), retrying: ${view.message}`
        );
        await closeSiteWindows(page, options.siteOrigin);
        await clickControl(
          page,
          TAG_ASSISTANT_SELECTORS.retryButton,
          controlTimeoutMs,
          'Could not connect to GTM Preview (Tag Assistant did not show its Retry button)'
        );
        break;
      case 'fail':
        throw step.reason === 'not-connected'
          ? new GtmPreviewConnectionError(
              `Could not connect to GTM Preview (Tag Assistant could not connect to ${site} after ${maxAttempts} attempts)`,
              `Tag Assistant said: ${view.message || 'nothing'}`
            )
          : new GtmPreviewConnectionError(
              'Could not connect to GTM Preview (Tag Assistant did not show the Continue button)',
              `No answer from Tag Assistant within ${attemptTimeoutMs}ms of attempt ${attempt}; it showed: ${view.message || 'nothing'}`
            );
    }
  }
}

/** Keeps the debug signal in the site's URL, then clicks Connect. */
async function clickStart(page: Page, timeoutMs: number): Promise<void> {
  const notStarted =
    'Could not start GTM Preview (Tag Assistant did not show its connect dialog)';
  try {
    await page.waitForSelector(TAG_ASSISTANT_SELECTORS.includeDebugParam, {
      visible: true,
      timeout: timeoutMs
    });
  } catch (error) {
    throw new GtmPreviewConnectionError(
      notStarted,
      `Waiting for ${TAG_ASSISTANT_SELECTORS.includeDebugParam}: ${error}`
    );
  }
  await page.evaluate(CHECK_INCLUDE_DEBUG_PARAM);
  await clickControl(
    page,
    TAG_ASSISTANT_SELECTORS.startButton,
    timeoutMs,
    notStarted
  );
}

async function clickControl(
  page: Page,
  selector: string,
  timeoutMs: number,
  clientMessage: string
): Promise<void> {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: timeoutMs });
    await page.click(selector);
  } catch (error) {
    throw new GtmPreviewConnectionError(
      clientMessage,
      `Failed to operate GTM preview control "${selector}": ${error}`
    );
  }
}

async function readView(page: Page): Promise<TagAssistantView> {
  try {
    return parseTagAssistantView(await page.evaluate(READ_TAG_ASSISTANT_VIEW));
  } catch {
    // Tag Assistant navigating between reads: look again.
    return parseTagAssistantView(null);
  }
}

/** Closes the site's windows, so the next attempt's window is the only one. */
async function closeSiteWindows(page: Page, siteOrigin: string): Promise<void> {
  for (const candidate of await page.browser().pages()) {
    if (candidate !== page && originOf(candidate.url()) === siteOrigin) {
      await candidate.close().catch(() => undefined);
    }
  }
}

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
