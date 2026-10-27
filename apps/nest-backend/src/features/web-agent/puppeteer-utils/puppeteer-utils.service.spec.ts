import { mkdtemp, readdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PuppeteerUtilsService } from './puppeteer-utils.service';
import { RunRecorder } from './run-recorder';

/** Stands in for a RunRecorder: only stop() is used by the service. */
function fakeRecorder() {
  return { stop: vi.fn().mockResolvedValue(undefined) };
}

const page = { bringToFront: vi.fn() };
const KEY = '0f0e6b2a-7c1d-4e5f-8a9b-1c2d3e4f5a6b';

describe('PuppeteerUtilsService recorder lifecycle', () => {
  let tempDir: string;
  let service: PuppeteerUtilsService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tag-check-puppeteer-'));
    service = new PuppeteerUtilsService(
      { getBROWSER_ARGS: vi.fn(() => []) } as never,
      { getRecordingDetails: vi.fn() } as never,
      {
        folderOf: vi.fn(async (_slug: string, _event: string, key: string) =>
          join(tempDir, 'runs', key)
        ),
        removeLegacy: vi.fn(async () => {
          await rm(join(tempDir, 'recording.webm'), { force: true });
        })
      } as never
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('does not start recording when the abort signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const start = vi.spyOn(RunRecorder, 'start');

    await expect(
      service.startRecorder(
        page as never,
        'project',
        'event',
        controller.signal,
        { recordingKey: KEY }
      )
    ).rejects.toThrow(/aborted/i);
    expect(start).not.toHaveBeenCalled();
  });

  it("records into the run's own folder with the bundled ffmpeg, removing the test's old file", async () => {
    await writeFile(join(tempDir, 'recording.webm'), 'an earlier run');
    const recorder = fakeRecorder();
    const start = vi
      .spyOn(RunRecorder, 'start')
      .mockResolvedValue(recorder as never);

    const result = await service.startRecorder(
      page as never,
      'project',
      'event',
      undefined,
      { recordingKey: KEY }
    );

    expect(result).toBe(recorder);
    expect(start).toHaveBeenCalledWith(
      page,
      join(tempDir, 'runs', KEY, 'recording.webm'),
      expect.stringMatching(/ffmpeg/i)
    );
    expect(await readdir(tempDir)).toEqual(['runs']);
    expect(await readdir(join(tempDir, 'runs'))).toEqual([KEY]);
  });

  it('stops and rejects when abort happens while recording is starting', async () => {
    const controller = new AbortController();
    const recorder = fakeRecorder();
    let resolveStart!: (value: typeof recorder) => void;
    const start = vi.spyOn(RunRecorder, 'start').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStart = resolve as never;
        })
    );

    const promise = service.startRecorder(
      page as never,
      'project',
      'event',
      controller.signal,
      { recordingKey: KEY }
    );
    await vi.waitFor(() => expect(start).toHaveBeenCalled());
    controller.abort();
    resolveStart(recorder);

    await expect(promise).rejects.toThrow(/aborted/i);
    expect(recorder.stop).toHaveBeenCalledTimes(1);
  });

  it('returns a live recorder on success and unregisters the abort listener when stopped', async () => {
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const recorder = fakeRecorder();
    vi.spyOn(RunRecorder, 'start').mockResolvedValue(recorder as never);

    const result = await service.startRecorder(
      page as never,
      'project',
      'event',
      controller.signal,
      { recordingKey: KEY }
    );
    await service.stopRecorder(result);

    expect(result).toBe(recorder);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(recorder.stop).toHaveBeenCalledTimes(1);
  });

  it('stops the returned recorder if the abort signal fires after startRecorder returns', async () => {
    const controller = new AbortController();
    const recorder = fakeRecorder();
    vi.spyOn(RunRecorder, 'start').mockResolvedValue(recorder as never);

    await service.startRecorder(
      page as never,
      'project',
      'event',
      controller.signal,
      { recordingKey: KEY }
    );
    controller.abort();

    await vi.waitFor(() => expect(recorder.stop).toHaveBeenCalledTimes(1));
  });

  it('removes the abort listener when the recorder fails to start', async () => {
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    vi.spyOn(RunRecorder, 'start').mockRejectedValue(
      new Error('screencast failed')
    );

    await expect(
      service.startRecorder(
        page as never,
        'project',
        'event',
        controller.signal,
        { recordingKey: KEY }
      )
    ).rejects.toThrow('screencast failed');
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('leaves no abort listener when the recording folder cannot be prepared', async () => {
    const controller = new AbortController();
    const addListener = vi.spyOn(controller.signal, 'addEventListener');
    const failing = new PuppeteerUtilsService(
      { getBROWSER_ARGS: vi.fn(() => []) } as never,
      { getRecordingDetails: vi.fn() } as never,
      {
        folderOf: vi.fn().mockRejectedValue(new Error('no project folder')),
        removeLegacy: vi.fn()
      } as never
    );

    await expect(
      failing.startRecorder(
        page as never,
        'project',
        'event',
        controller.signal,
        { recordingKey: KEY }
      )
    ).rejects.toThrow('no project folder');
    expect(addListener).not.toHaveBeenCalled();
  });

  it('stops only the recorder passed to stopRecorder', async () => {
    const firstRecorder = fakeRecorder();
    const secondRecorder = fakeRecorder();

    await service.stopRecorder(firstRecorder as never);

    expect(firstRecorder.stop).toHaveBeenCalledTimes(1);
    expect(secondRecorder.stop).not.toHaveBeenCalled();
  });

  it('treats stopRecorder without a recorder as a no-op', async () => {
    await expect(service.stopRecorder(null)).resolves.toBeUndefined();
    await expect(service.stopRecorder(undefined)).resolves.toBeUndefined();
  });

  it('cleanup stops the provided recorder before closing the page and browser', async () => {
    const recorder = { stop: vi.fn().mockResolvedValue(undefined) };
    const page = { close: vi.fn().mockResolvedValue(undefined) };
    const browser = { close: vi.fn().mockResolvedValue(undefined) };

    await service.cleanup(browser as never, page as never, recorder as never);

    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(page.close).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('cleanup moves on to the browser when a page never finishes closing', async () => {
    vi.useFakeTimers();
    try {
      // A tab with DevTools attached never resolves page.close().
      const page = { close: vi.fn(() => new Promise<void>(() => undefined)) };
      const browser = {
        close: vi.fn().mockResolvedValue(undefined),
        process: vi.fn()
      };

      const cleanup = service.cleanup(browser as never, page as never);
      await vi.advanceTimersByTimeAsync(10_000);
      await cleanup;

      expect(browser.close).toHaveBeenCalledTimes(1);
      expect(browser.process).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleanup kills the browser process when the browser never finishes closing', async () => {
    vi.useFakeTimers();
    try {
      const kill = vi.fn();
      const browser = {
        close: vi.fn(() => new Promise<void>(() => undefined)),
        process: vi.fn(() => ({ kill }))
      };

      const cleanup = service.cleanup(browser as never, null as never);
      await vi.advanceTimersByTimeAsync(10_000);
      await cleanup;

      expect(kill).toHaveBeenCalledWith('SIGKILL');
    } finally {
      vi.useRealTimers();
    }
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

    expect(service['filterPuppeteerArgs'](args)).toEqual([
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1400,900'
    ]);
  });
});

describe('PuppeteerUtilsService.startBrowser', () => {
  const preset = {
    application: { localStorage: { data: [] }, cookie: { data: [] } },
    puppeteerArgs: []
  };

  /** A service whose Chromium launch returns `browser`. */
  function serviceLaunching(browser: unknown) {
    const service = new PuppeteerUtilsService(
      { getBROWSER_ARGS: vi.fn(() => []) } as never,
      {} as never,
      {} as never
    );
    vi.spyOn(
      service as unknown as { resolveChromium: () => Promise<unknown> },
      'resolveChromium'
    ).mockResolvedValue({
      puppeteer: { launch: vi.fn().mockResolvedValue(browser) },
      executablePath: 'chrome'
    });
    return service;
  }

  function createBrowser(onPages: () => void = () => undefined) {
    const page = { close: vi.fn().mockResolvedValue(undefined) };
    return {
      page,
      pages: vi.fn(async () => {
        onPages();
        return [page];
      }),
      close: vi.fn().mockResolvedValue(undefined),
      process: vi.fn(() => null)
    };
  }

  it('returns the browser with its first page', async () => {
    const browser = createBrowser();
    const service = serviceLaunching(browser);

    const started = await service.startBrowser(
      'true',
      '',
      preset,
      new AbortController().signal
    );

    expect(started).toEqual({ browser, page: browser.page });
    expect(browser.close).not.toHaveBeenCalled();
  });

  it('closes the browser and rejects when the run is aborted while Chromium starts', async () => {
    const controller = new AbortController();
    const browser = createBrowser(() => controller.abort());
    const service = serviceLaunching(browser);

    await expect(
      service.startBrowser('true', '', preset, controller.signal)
    ).rejects.toThrow(/aborted/i);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('closes the browser once when the run is aborted after it started', async () => {
    const controller = new AbortController();
    const browser = createBrowser();
    const service = serviceLaunching(browser);

    await service.startBrowser('true', '', preset, controller.signal);
    controller.abort();

    await vi.waitFor(() => expect(browser.close).toHaveBeenCalledTimes(1));
  });
});
