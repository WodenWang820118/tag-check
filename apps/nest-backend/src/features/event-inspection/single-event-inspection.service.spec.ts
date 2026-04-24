import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SingleEventInspectionService } from './single-event-inspection.service';

describe('SingleEventInspectionService recorder lifecycle', () => {
  let service: SingleEventInspectionService;
  let pipeline: { singleEventInspectionRecipe: ReturnType<typeof vi.fn> };
  let puppeteerUtils: {
    startBrowser: ReturnType<typeof vi.fn>;
    applyRecordedViewport: ReturnType<typeof vi.fn>;
    startRecorder: ReturnType<typeof vi.fn>;
    stopRecorder: ReturnType<typeof vi.fn>;
    cleanup: ReturnType<typeof vi.fn>;
  };
  let browser: ReturnType<typeof createMockBrowser>;
  let page: Record<string, unknown>;
  let recorder: { stop: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });
    browser = createMockBrowser();
    page = {};
    recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    pipeline = {
      singleEventInspectionRecipe: vi.fn().mockResolvedValue([{ passed: true }])
    };
    puppeteerUtils = {
      startBrowser: vi.fn().mockResolvedValue({ browser, page }),
      applyRecordedViewport: vi.fn().mockResolvedValue(undefined),
      startRecorder: vi.fn().mockResolvedValue(recorder),
      stopRecorder: vi.fn().mockResolvedValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined)
    };
    service = new SingleEventInspectionService(
      pipeline as any,
      puppeteerUtils as any
    );
  });

  it('stops the recorder handle returned by startRecorder on success', async () => {
    await service.inspectSingleEvent('project', 'event', createOptions());

    expect(puppeteerUtils.startRecorder).toHaveBeenCalledWith(
      page,
      'project',
      'event',
      expect.any(AbortSignal)
    );
    expect(puppeteerUtils.stopRecorder).toHaveBeenCalledWith(recorder);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('passes the recorder handle to cleanup on failure', async () => {
    pipeline.singleEventInspectionRecipe.mockRejectedValue(new Error('failed'));

    await expect(
      service.inspectSingleEvent('project', 'event', createOptions())
    ).rejects.toThrow(/failed/);

    expect(puppeteerUtils.stopRecorder).not.toHaveBeenCalled();
    expect(puppeteerUtils.cleanup).toHaveBeenCalledWith(
      browser,
      page,
      recorder
    );
  });
});

function createOptions() {
  return {
    headless: 'true',
    measurementId: 'G-TEST',
    credentials: { username: '', password: '' },
    captureRequest: 'false',
    url: 'https://example.test',
    eventInspectionPresetDto: {
      application: {
        localStorage: { data: [] },
        cookie: { data: [] }
      },
      puppeteerArgs: []
    }
  } as any;
}

function createMockBrowser() {
  return {
    pages: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
    setCookie: vi.fn().mockResolvedValue(undefined)
  };
}
