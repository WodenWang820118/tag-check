import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GtmOperatorService } from './gtm-operator.service';

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
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
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
      pipeline as any,
      puppeteerUtils as any,
      {} as any
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
});

describe('GtmOperatorService.operateGtmPreviewMode', () => {
  it('waits for each required GTM preview control before clicking it', async () => {
    const service = new GtmOperatorService({} as any, {} as any, {} as any);
    const page = createPreviewPage();

    await service.operateGtmPreviewMode(
      page as any,
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
    const service = new GtmOperatorService({} as any, {} as any, {} as any);
    const page = createPreviewPage();
    page.waitForSelector.mockRejectedValueOnce(new Error('missing control'));

    await expect(
      service.operateGtmPreviewMode(
        page as any,
        'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test'
      )
    ).rejects.toThrow(/Failed to operate GTM preview control/);

    expect(page.click).not.toHaveBeenCalled();
  });
});

function createQuery() {
  return {
    headless: 'true',
    measurementId: 'G-TEST',
    gtmUrl: 'https://tagassistant.google.com/#url=https%3A%2F%2Fexample.test',
    captureRequest: 'false'
  } as any;
}

function createPreset() {
  return {
    application: {
      localStorage: { data: [] },
      cookie: { data: [] }
    },
    puppeteerArgs: []
  } as any;
}

function createMockBrowser(targetPage: ReturnType<typeof createMockPage>) {
  return {
    pages: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
    setCookie: vi.fn().mockResolvedValue(undefined),
    waitForTarget: vi.fn().mockResolvedValue({
      url: vi.fn(() => 'https://example.test/product'),
      asPage: vi.fn().mockResolvedValue(targetPage)
    })
  };
}

function createMockPage() {
  return {
    bringToFront: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined)
  };
}

function createPreviewPage() {
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue({}),
    click: vi.fn().mockResolvedValue(undefined)
  };
}
