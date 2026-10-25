import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import {
  CHECK_INCLUDE_DEBUG_PARAM,
  connectTagAssistant,
  decideConnectionStep,
  GtmPreviewConnectionError,
  parseTagAssistantView,
  READ_TAG_ASSISTANT_VIEW,
  TAG_ASSISTANT_SELECTORS,
  type TagAssistantView
} from './tag-assistant-connection';

const SITE_ORIGIN = 'https://example.test';

const connecting: TagAssistantView = {
  continueVisible: false,
  connected: false,
  retryVisible: false,
  message: 'Connecting this window to example.test…'
};
const connectedDialog: TagAssistantView = {
  continueVisible: true,
  connected: true,
  retryVisible: false,
  message: 'Connected!'
};
const connectedHeader: TagAssistantView = {
  ...connecting,
  connected: true,
  message: ''
};
const couldNotConnect: TagAssistantView = {
  continueVisible: false,
  connected: false,
  retryVisible: true,
  message: 'A timeout occurred while attempting to connect to example.test'
};

describe('decideConnectionStep', () => {
  const first = { attempt: 1, maxAttempts: 2, timedOut: false };

  it('clicks Continue when the "Connected!" dialog is open', () => {
    expect(decideConnectionStep(connectedDialog, first)).toEqual({
      kind: 'continue'
    });
  });

  it('is connected when the header says so without the dialog', () => {
    expect(decideConnectionStep(connectedHeader, first)).toEqual({
      kind: 'connected'
    });
  });

  it('retries a "Could not connect" while attempts are left', () => {
    expect(decideConnectionStep(couldNotConnect, first)).toEqual({
      kind: 'retry'
    });
  });

  it('fails a "Could not connect" on the last attempt', () => {
    expect(
      decideConnectionStep(couldNotConnect, { ...first, attempt: 2 })
    ).toEqual({ kind: 'fail', reason: 'not-connected' });
  });

  it('waits while connecting, and fails with no answer once timed out', () => {
    expect(decideConnectionStep(connecting, first)).toEqual({ kind: 'wait' });
    expect(
      decideConnectionStep(connecting, { ...first, timedOut: true })
    ).toEqual({ kind: 'fail', reason: 'no-answer' });
  });

  it('prefers an answer to the timeout', () => {
    expect(
      decideConnectionStep(connectedDialog, { ...first, timedOut: true })
    ).toEqual({ kind: 'continue' });
  });
});

describe('parseTagAssistantView', () => {
  it('reads the JSON the page returns', () => {
    expect(parseTagAssistantView(JSON.stringify(connectedDialog))).toEqual(
      connectedDialog
    );
  });

  it('reads anything else as an empty view', () => {
    const empty = {
      continueVisible: false,
      connected: false,
      retryVisible: false,
      message: ''
    };
    expect(parseTagAssistantView(undefined)).toEqual(empty);
    expect(parseTagAssistantView('not json')).toEqual(empty);
    expect(parseTagAssistantView('{"continueVisible":"yes"}')).toEqual(empty);
  });
});

describe('Tag Assistant page scripts', () => {
  // A fresh context: the page has none of the bundle's helpers.
  function fakeDocument(elements: Record<string, object>) {
    return {
      querySelector: (selector: string) => elements[selector] ?? null
    };
  }
  const shown = { getBoundingClientRect: () => ({ width: 80, height: 32 }) };

  it('reads the "Connected!" dialog', () => {
    const document = fakeDocument({
      [TAG_ASSISTANT_SELECTORS.continueButton]: shown,
      [TAG_ASSISTANT_SELECTORS.connectedHeader]: {},
      '.not-connected__errors': {
        innerText: ' Debug information\n will appear '
      }
    });

    const view = parseTagAssistantView(
      runInNewContext(READ_TAG_ASSISTANT_VIEW, { document, JSON })
    );

    expect(view).toEqual({
      continueVisible: true,
      connected: true,
      retryVisible: false,
      message: 'Debug information will appear'
    });
  });

  it('reads the "Could not connect" dialog', () => {
    const document = fakeDocument({
      [TAG_ASSISTANT_SELECTORS.retryButton]: shown,
      '.not-connected__errors': { innerText: 'A timeout occurred' }
    });

    const view = parseTagAssistantView(
      runInNewContext(READ_TAG_ASSISTANT_VIEW, { document, JSON })
    );

    expect(view).toMatchObject({
      continueVisible: false,
      retryVisible: true,
      message: 'A timeout occurred'
    });
  });

  it('checks the debug signal box only when it is unchecked', () => {
    const checked = { checked: true, click: vi.fn() };
    const unchecked = { checked: false, click: vi.fn() };

    runInNewContext(CHECK_INCLUDE_DEBUG_PARAM, {
      document: fakeDocument({ '#include-debug-param': checked })
    });
    runInNewContext(CHECK_INCLUDE_DEBUG_PARAM, {
      document: fakeDocument({ '#include-debug-param': unchecked })
    });

    expect(checked.click).not.toHaveBeenCalled();
    expect(unchecked.click).toHaveBeenCalledOnce();
  });
});

describe('connectTagAssistant', () => {
  it('connects, then clicks Continue in the "Connected!" dialog', async () => {
    const page = createTagAssistantPage([
      connecting,
      connecting,
      connectedDialog
    ]);

    await connectTagAssistant(page.asPage(), fastOptions());

    expect(page.evaluate).toHaveBeenCalledWith(CHECK_INCLUDE_DEBUG_PARAM);
    expect(page.click.mock.calls.map(([selector]) => selector)).toEqual([
      TAG_ASSISTANT_SELECTORS.startButton,
      TAG_ASSISTANT_SELECTORS.continueButton
    ]);
  });

  it('goes on without Continue when Tag Assistant connected without its dialog', async () => {
    const page = createTagAssistantPage([connecting, connectedHeader]);

    await connectTagAssistant(page.asPage(), fastOptions());

    expect(page.click.mock.calls.map(([selector]) => selector)).toEqual([
      TAG_ASSISTANT_SELECTORS.startButton
    ]);
  });

  it('is connected when the dialog closes before Continue is clicked', async () => {
    const page = createTagAssistantPage([connectedDialog, connectedHeader]);
    page.click.mockImplementation(async (selector: string) => {
      if (selector === TAG_ASSISTANT_SELECTORS.continueButton) {
        throw new Error('Node is detached from document');
      }
    });

    await expect(
      connectTagAssistant(page.asPage(), fastOptions())
    ).resolves.toBeUndefined();
  });

  it("closes the failed attempt's site window and retries once Tag Assistant could not connect", async () => {
    const page = createTagAssistantPage([
      connecting,
      couldNotConnect,
      connecting,
      connectedDialog
    ]);
    const warn = vi.fn();

    await connectTagAssistant(page.asPage(), { ...fastOptions(), warn });

    expect(page.click.mock.calls.map(([selector]) => selector)).toEqual([
      TAG_ASSISTANT_SELECTORS.startButton,
      TAG_ASSISTANT_SELECTORS.retryButton,
      TAG_ASSISTANT_SELECTORS.startButton,
      TAG_ASSISTANT_SELECTORS.continueButton
    ]);
    expect(page.sitePage.close).toHaveBeenCalledOnce();
    expect(page.otherPage.close).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('A timeout occurred')
    );
  });

  it('fails with a readable message when Tag Assistant cannot connect on any attempt', async () => {
    const page = createTagAssistantPage([couldNotConnect, couldNotConnect]);

    const error: unknown = await connectTagAssistant(
      page.asPage(),
      fastOptions()
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(GtmPreviewConnectionError);
    expect(error).toMatchObject({
      clientMessage:
        'Could not connect to GTM Preview (Tag Assistant could not connect to example.test after 2 attempts)'
    });
    expect(String(error)).toContain('A timeout occurred');
  });

  it('fails when Tag Assistant shows neither Continue nor a failure in time', async () => {
    const page = createTagAssistantPage([connecting]);

    const error: unknown = await connectTagAssistant(
      page.asPage(),
      fastOptions()
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(GtmPreviewConnectionError);
    expect(error).toMatchObject({
      clientMessage:
        'Could not connect to GTM Preview (Tag Assistant did not show the Continue button)'
    });
    expect(page.click).toHaveBeenCalledTimes(1);
  });

  it('fails with a readable message when the connect dialog is missing', async () => {
    const page = createTagAssistantPage([connecting]);
    page.waitForSelector.mockRejectedValueOnce(
      new Error('Waiting for selector `#include-debug-param` failed')
    );

    await expect(
      connectTagAssistant(page.asPage(), fastOptions())
    ).rejects.toMatchObject({
      clientMessage:
        'Could not start GTM Preview (Tag Assistant did not show its connect dialog)'
    });
    expect(page.click).not.toHaveBeenCalled();
  });
});

/** Options with a fake clock: each sleep advances it. */
function fastOptions() {
  let clock = 0;
  return {
    siteOrigin: SITE_ORIGIN,
    attemptTimeoutMs: 1000,
    pollIntervalMs: 250,
    sleep: async (ms: number) => {
      clock += ms;
    },
    now: () => clock
  };
}

/**
 * A Tag Assistant page that shows `views` in turn, one per read, and then
 * keeps showing the last. Its browser has a site window and another page.
 */
function createTagAssistantPage(views: TagAssistantView[]) {
  let read = 0;
  const sitePage = {
    url: () => `${SITE_ORIGIN}/home?gtm_debug=1`,
    close: vi.fn().mockResolvedValue(undefined)
  };
  const otherPage = {
    url: () => 'https://tagassistant.google.com/',
    close: vi.fn().mockResolvedValue(undefined)
  };
  const pages: unknown[] = [];
  const page = {
    sitePage,
    otherPage,
    waitForSelector: vi.fn().mockResolvedValue({}),
    click: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockImplementation(async (script: string) => {
      if (script !== READ_TAG_ASSISTANT_VIEW) {
        return true;
      }
      const view = views[Math.min(read, views.length - 1)];
      read++;
      return JSON.stringify(view);
    }),
    browser: () => ({ pages: async () => pages })
  };
  pages.push(page, sitePage, otherPage);
  return { ...page, asPage: (): never => page as never };
}
