import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PuppeteerUtilsService } from './puppeteer-utils.service';

describe('PuppeteerUtilsService recorder lifecycle', () => {
  let tempDir: string;
  let service: PuppeteerUtilsService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tag-check-puppeteer-'));
    service = new PuppeteerUtilsService(
      { getBROWSER_ARGS: vi.fn(() => []) } as any,
      { getRecordingDetails: vi.fn() } as any,
      {
        getInspectionEventFolderPath: vi.fn().mockResolvedValue(tempDir)
      } as any
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('does not start screencast when the abort signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn()
    };

    await expect(
      (service as any).startRecorder(
        page,
        'project',
        'event',
        controller.signal
      )
    ).rejects.toThrow(/aborted/i);
    expect(page.screencast).not.toHaveBeenCalled();
  });

  it('stops and rejects when abort happens while screencast is starting', async () => {
    const controller = new AbortController();
    const recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    let resolveScreencast!: (value: typeof recorder) => void;
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn(
        () =>
          new Promise<typeof recorder>((resolve) => {
            resolveScreencast = resolve;
          })
      )
    };

    const promise = (service as any).startRecorder(
      page,
      'project',
      'event',
      controller.signal
    );
    await vi.waitFor(() => expect(page.screencast).toHaveBeenCalled());
    controller.abort();
    resolveScreencast(recorder);

    await expect(promise).rejects.toThrow(/aborted/i);
    expect(recorder.stop).toHaveBeenCalledTimes(1);
  });

  it('returns a live recorder on success and unregisters the abort listener when stopped', async () => {
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockResolvedValue(recorder)
    };

    const result = await (service as any).startRecorder(
      page,
      'project',
      'event',
      controller.signal
    );
    await (service as any).stopRecorder(result);

    expect(result).toBe(recorder);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(recorder.stop).toHaveBeenCalledTimes(1);
  });

  it('stops the returned recorder if the abort signal fires after startRecorder returns', async () => {
    const controller = new AbortController();
    const recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockResolvedValue(recorder)
    };

    await (service as any).startRecorder(
      page,
      'project',
      'event',
      controller.signal
    );
    controller.abort();

    await vi.waitFor(() => expect(recorder.stop).toHaveBeenCalledTimes(1));
  });

  it('removes the abort listener when screencast fails before returning a recorder', async () => {
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockRejectedValue(new Error('ffmpeg failed'))
    };

    await expect(
      (service as any).startRecorder(
        page,
        'project',
        'event',
        controller.signal
      )
    ).rejects.toThrow('ffmpeg failed');
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('stops only the recorder passed to stopRecorder', async () => {
    const firstRecorder = { stop: vi.fn().mockResolvedValue(undefined) };
    const secondRecorder = { stop: vi.fn().mockResolvedValue(undefined) };

    await (service as any).stopRecorder(firstRecorder);

    expect(firstRecorder.stop).toHaveBeenCalledTimes(1);
    expect(secondRecorder.stop).not.toHaveBeenCalled();
  });

  it('treats stopRecorder without a recorder as a no-op', async () => {
    await expect((service as any).stopRecorder(null)).resolves.toBeUndefined();
    await expect(
      (service as any).stopRecorder(undefined)
    ).resolves.toBeUndefined();
  });

  it('cleanup stops the provided recorder before closing the page and browser', async () => {
    const recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    const page = { close: vi.fn().mockResolvedValue(undefined) };
    const browser = { close: vi.fn().mockResolvedValue(undefined) };

    await (service as any).cleanup(browser, page, recorder);

    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(page.close).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('filters dangerous Chromium args after merge while preserving container-safe flags', () => {
    const args = [
      '--no-sandbox',
      '--remote-debugging-port=9222',
      '--user-data-dir',
      'C:/tmp/profile',
      '--disable-setuid-sandbox',
      '--window-size=1400,900'
    ];

    expect((service as any).filterPuppeteerArgs(args)).toEqual([
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1400,900'
    ]);
  });
});
