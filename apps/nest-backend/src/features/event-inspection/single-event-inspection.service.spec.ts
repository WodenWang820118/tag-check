import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RunQueueService } from '../event-inspection-pipeline/run-queue.service';
import {
  InspectSingleEventOptions,
  SingleEventInspectionService
} from './single-event-inspection.service';

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
    vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0 as unknown as NodeJS.Timeout;
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
      pipeline as never,
      puppeteerUtils as never,
      new RunQueueService()
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

  it('starts a second run only after the first one has finished', async () => {
    let finishFirst: (value: unknown) => void = () => undefined;
    pipeline.singleEventInspectionRecipe.mockReturnValueOnce(
      new Promise((resolve) => {
        finishFirst = resolve;
      })
    );

    const first = service.inspectSingleEvent('project', 'a', createOptions());
    const second = service.inspectSingleEvent('project', 'b', createOptions());
    await vi.waitFor(() =>
      expect(pipeline.singleEventInspectionRecipe).toHaveBeenCalledOnce()
    );
    expect(puppeteerUtils.startBrowser).toHaveBeenCalledOnce();

    finishFirst([{ passed: true }]);
    await Promise.all([first, second]);
    expect(puppeteerUtils.startBrowser).toHaveBeenCalledTimes(2);
    expect(browser.close).toHaveBeenCalledTimes(2);
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

function createOptions(): InspectSingleEventOptions {
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
  };
}

function createMockBrowser() {
  return {
    pages: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
    setCookie: vi.fn().mockResolvedValue(undefined)
  };
}
