import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import {
  GtmOperatorService,
  TAG_ASSISTANT_BADGE_PASSTHROUGH
} from './gtm-operator.service';
import type { InspectGtmQueryDto } from '../../shared/dto/gtm-operator';
import type { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';

describe('GtmOperatorService recorder lifecycle', () => {
  let service: GtmOperatorService;
  let pipeline: { singleEventInspectionRecipe: ReturnType<typeof vi.fn> };
  let puppeteerUtils: {
    startBrowser: ReturnType<typeof vi.fn>;
    applyRecordedViewport: ReturnType<typeof vi.fn>;
    startRecorder: ReturnType<typeof vi.fn>;
    stopRecorder: ReturnType<typeof vi.fn>;
    cleanup: ReturnType<typeof vi.fn>;
  };
  let browser: ReturnType<typeof createMockBrowser>;
  let openerPage: Record<string, unknown>;
  let targetPage: ReturnType<typeof createMockPage>;
  let recorder: { stop: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0 as unknown as NodeJS.Timeout;
    });
    targetPage = createMockPage();
    browser = createMockBrowser(targetPage);
    openerPage = {};
    recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    pipeline = {
      singleEventInspectionRecipe: vi.fn().mockResolvedValue([{ passed: true }])
    };
    puppeteerUtils = {
      startBrowser: vi.fn().mockResolvedValue({ browser, page: openerPage }),
      applyRecordedViewport: vi.fn().mockResolvedValue(undefined),
      startRecorder: vi.fn().mockResolvedValue(recorder),
      stopRecorder: vi.fn().mockResolvedValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined)
    };
    service = new GtmOperatorService(
      pipeline as never,
      puppeteerUtils as never,
      {} as never
    );
    vi.spyOn(service, 'operateGtmPreviewMode').mockResolvedValue(undefined);
  });

  it('stops the recorder through PuppeteerUtilsService on success', async () => {
    await service.inspectSingleEventViaGtm(
      'project',
      'event',
      createQuery(),
      createPreset()
    );

    expect(puppeteerUtils.startRecorder).toHaveBeenCalledWith(
      targetPage,
      'project',
      'event',
      expect.any(AbortSignal)
    );
    expect(recorder.stop).not.toHaveBeenCalled();
    expect(puppeteerUtils.stopRecorder).toHaveBeenCalledWith(recorder);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('passes the recorder handle to cleanup on failure', async () => {
    pipeline.singleEventInspectionRecipe.mockRejectedValue(new Error('failed'));

    await expect(
      service.inspectSingleEventViaGtm(
        'project',
        'event',
        createQuery(),
        createPreset()
      )
    ).rejects.toThrow('Failed to perform GTM validation');

    expect(puppeteerUtils.stopRecorder).not.toHaveBeenCalled();
    expect(puppeteerUtils.cleanup).toHaveBeenCalledWith(
      browser,
      openerPage,
      recorder
    );
  });

  it('leaves the browser open after a successful headful GTM inspection', async () => {
    await service.inspectSingleEventViaGtm(
      'project',
      'event',
      { ...createQuery(), headless: 'false' },
      createPreset()
    );

    expect(puppeteerUtils.stopRecorder).toHaveBeenCalledWith(recorder);
    expect(browser.close).not.toHaveBeenCalled();
    expect(puppeteerUtils.cleanup).not.toHaveBeenCalled();
  });

  it('stops the recorder and skips cleanup after a failed headful GTM inspection', async () => {
    pipeline.singleEventInspectionRecipe.mockRejectedValue(new Error('failed'));

    await expect(
      service.inspectSingleEventViaGtm(
        'project',
        'event',
        { ...createQuery(), headless: 'false' },
        createPreset()
      )
    ).rejects.toThrow('Failed to perform GTM validation');

    expect(puppeteerUtils.stopRecorder).toHaveBeenCalledWith(recorder);
    expect(puppeteerUtils.cleanup).not.toHaveBeenCalled();
    expect(browser.close).not.toHaveBeenCalled();
  });

  it('applies preset cookies to the preview target host instead of Tag Assistant', async () => {
    await service.inspectSingleEventViaGtm(
      'project',
      'event',
      createQuery(),
      createPreset({
        cookie: [{ key: 'consent_cookie', value: 'accepted' }]
      })
    );

    expect(browser.setCookie).toHaveBeenCalledWith({
      name: 'consent_cookie',
      value: 'accepted',
      domain: 'example.test'
    });
  });

  it('preloads localStorage before the GTM target page is navigated for inspection', async () => {
    const callOrder: string[] = [];
    targetPage = createMockPage(callOrder);
    browser = createMockBrowser(targetPage);
    puppeteerUtils.startBrowser.mockResolvedValue({
      browser,
      page: openerPage
    });

    const preset = createPreset({
      localStorage: [
        { key: 'consent', value: 'true' },
        {
          key: 'consentPreferences',
          value: { necessary: true, analytics: true }
        }
      ]
    });

    await service.inspectSingleEventViaGtm(
      'project',
      'event',
      createQuery(),
      preset
    );

    expect(targetPage.evaluateOnNewDocument).toHaveBeenCalledWith(
      expect.stringContaining('"consentPreferences"')
    );
    expect(callOrder).toEqual([
      'bringToFront',
      'evaluateOnNewDocument',
      'evaluateOnNewDocument',
      'goto'
    ]);
    expect(targetPage.evaluateOnNewDocument).toHaveBeenCalledWith(
      TAG_ASSISTANT_BADGE_PASSTHROUGH
    );
    expect(targetPage.goto).toHaveBeenCalledWith(
      'https://example.test/product?gtm_debug=TAGASSISTANT'
    );
  });

  it("seeds the site's localStorage before Tag Assistant opens the site", async () => {
    // Sites that load GTM only after stored consent never connect otherwise.
    const callOrder: string[] = [];
    browser = createMockBrowser(targetPage, callOrder);
    puppeteerUtils.startBrowser.mockResolvedValue({
      browser,
      page: openerPage
    });
    vi.mocked(service.operateGtmPreviewMode).mockImplementation(async () => {
      callOrder.push('tag assistant');
    });

    await service.inspectSingleEventViaGtm(
      'project',
      'event',
      createQuery(),
      createPreset({ localStorage: [{ key: 'consent', value: 'true' }] })
    );

    expect(callOrder).toEqual(['seed https://example.test', 'tag assistant']);
  });

  it('cleans up and rejects invalid GTM preview URLs before inspection continues', async () => {
    await expect(
      service.inspectSingleEventViaGtm(
        'project',
        'event',
        {
          ...createQuery(),
          gtmUrl: 'https://tagassistant.google.com/#source=TAG_MANAGER'
        },
        createPreset()
      )
    ).rejects.toThrow('GTM preview URL must include a target website URL');

    expect(puppeteerUtils.cleanup).toHaveBeenCalledWith(
      browser,
      openerPage,
      null
    );
    expect(service.operateGtmPreviewMode).not.toHaveBeenCalled();
  });
});

describe('TAG_ASSISTANT_BADGE_PASSTHROUGH', () => {
  it('lets clicks pass through the Tag Assistant badge', () => {
    const appended: Array<{ textContent: string }> = [];
    const document = {
      documentElement: {},
      head: {
        appendChild: (node: { textContent: string }) => appended.push(node)
      },
      createElement: () => ({ textContent: '' }),
      addEventListener: vi.fn()
    };

    // A fresh context: the page has none of the bundle's helpers.
    runInNewContext(TAG_ASSISTANT_BADGE_PASSTHROUGH, { document });

    expect(appended).toEqual([
      {
        textContent:
          '.__TAG_ASSISTANT_BADGE { pointer-events: none !important; }'
      }
    ]);
  });
});

describe('GtmOperatorService.operateGtmPreviewMode', () => {
  it('waits for each required GTM preview control before clicking it', async () => {
    const service = new GtmOperatorService(
      {} as never,
      {} as never,
      {} as never
    );
    const page = createPreviewPage();

    await service.operateGtmPreviewMode(
      page as never,
      'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test'
    );

    expect(page.goto).toHaveBeenCalledWith(
      'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test',
      { waitUntil: 'networkidle2' }
    );
    expect(page.waitForSelector).toHaveBeenCalledWith('#include-debug-param', {
      visible: true
    });
    expect(page.waitForSelector).toHaveBeenCalledWith('#domain-start-button', {
      visible: true
    });
    expect(page.waitForSelector).toHaveBeenCalledWith(
      '.btn.btn--filled.wd-continue-debugging-button',
      { visible: true }
    );
    expect(page.click).toHaveBeenNthCalledWith(1, '#include-debug-param');
    expect(page.click).toHaveBeenNthCalledWith(2, '#domain-start-button');
    expect(page.click).toHaveBeenNthCalledWith(
      3,
      '.btn.btn--filled.wd-continue-debugging-button'
    );
  });

  it('fails fast when a required GTM preview control is missing', async () => {
    const service = new GtmOperatorService(
      {} as never,
      {} as never,
      {} as never
    );
    const page = createPreviewPage();
    page.waitForSelector.mockRejectedValueOnce(new Error('missing control'));

    await expect(
      service.operateGtmPreviewMode(
        page as never,
        'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test'
      )
    ).rejects.toThrow(/Failed to operate GTM preview control/);

    expect(page.click).not.toHaveBeenCalled();
  });
});

describe('GtmOperatorService.extractBaseUrlFromGtmUrl', () => {
  it('returns the decoded website URL from the GTM preview hash', () => {
    const service = new GtmOperatorService(
      {} as never,
      {} as never,
      {} as never
    );

    expect(
      service.extractBaseUrlFromGtmUrl(
        'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test%2Fproduct%3Ffoo%3Dbar&source=TAG_MANAGER'
      )
    ).toBe('https://example.test/product?foo=bar');
  });

  it('returns an empty string when the GTM preview hash has no target url', () => {
    const service = new GtmOperatorService(
      {} as never,
      {} as never,
      {} as never
    );

    expect(
      service.extractBaseUrlFromGtmUrl(
        'https://tagassistant.google.com/#source=TAG_MANAGER'
      )
    ).toBe('');
  });
});

function createQuery(): InspectGtmQueryDto {
  return {
    headless: 'true',
    measurementId: 'G-TEST',
    gtmUrl: 'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test',
    captureRequest: 'false'
  };
}

function createPreset(options?: {
  cookie?: Array<{ key: string; value: unknown }>;
  localStorage?: Array<{ key: string; value: unknown }>;
}): EventInspectionPresetDto {
  // Values may be non-strings on purpose: the preload script stringifies them.
  return {
    application: {
      localStorage: { data: options?.localStorage ?? [] },
      cookie: { data: options?.cookie ?? [] }
    },
    puppeteerArgs: []
  } as EventInspectionPresetDto;
}

function createMockBrowser(
  targetPage: ReturnType<typeof createMockPage>,
  callOrder?: string[]
) {
  return {
    newPage: vi.fn().mockImplementation(async () => createSeedPage(callOrder)),
    pages: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
    setCookie: vi.fn().mockResolvedValue(undefined),
    waitForTarget: vi.fn().mockResolvedValue({
      url: vi.fn(() => 'https://example.test/product?gtm_debug=TAGASSISTANT'),
      asPage: vi.fn().mockResolvedValue(targetPage)
    })
  };
}

function createMockPage(callOrder?: string[]) {
  return {
    bringToFront: vi.fn().mockImplementation(async () => {
      callOrder?.push('bringToFront');
    }),
    evaluateOnNewDocument: vi.fn().mockImplementation(async () => {
      callOrder?.push('evaluateOnNewDocument');
    }),
    goto: vi.fn().mockImplementation(async () => {
      callOrder?.push('goto');
    })
  };
}

function createSeedPage(callOrder?: string[]) {
  return {
    setRequestInterception: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    goto: vi.fn().mockImplementation(async (url: string) => {
      callOrder?.push(`seed ${url}`);
    }),
    evaluate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  };
}

function createPreviewPage() {
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue({}),
    click: vi.fn().mockResolvedValue(undefined)
  };
}
