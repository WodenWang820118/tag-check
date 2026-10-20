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

describe('PuppeteerUtilsService recorder lifecycle', () => {
  let tempDir: string;
  let service: PuppeteerUtilsService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tag-check-puppeteer-'));
    service = new PuppeteerUtilsService(
      { getBROWSER_ARGS: vi.fn(() => []) } as never,
      { getRecordingDetails: vi.fn() } as never,
      {
        getInspectionEventFolderPath: vi.fn().mockResolvedValue(tempDir)
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
        controller.signal
      )
    ).rejects.toThrow(/aborted/i);
    expect(start).not.toHaveBeenCalled();
  });

  it('records the event folder recording.webm with the bundled ffmpeg, replacing an old file', async () => {
    const file = join(tempDir, 'recording.webm');
    await writeFile(file, 'previous run');
    const recorder = fakeRecorder();
    const start = vi
      .spyOn(RunRecorder, 'start')
      .mockResolvedValue(recorder as never);

    const result = await service.startRecorder(
      page as never,
      'project',
      'event'
    );

    expect(result).toBe(recorder);
    expect(start).toHaveBeenCalledWith(
      page,
      file,
      expect.stringMatching(/ffmpeg/i)
    );
    expect(await readdir(tempDir)).toEqual([]);
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
      controller.signal
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
      controller.signal
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
      controller.signal
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
        controller.signal
      )
    ).rejects.toThrow('screencast failed');
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
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
