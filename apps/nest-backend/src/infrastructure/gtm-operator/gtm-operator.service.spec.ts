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
