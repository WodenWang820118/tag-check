import { mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { PassThrough } from 'stream';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock
} from 'vitest';
import { PuppeteerUtilsService } from './puppeteer-utils.service';

/** A screencast stream that ends when stopped, like ScreenRecorder. */
function fakeRecorder() {
  const stream = new PassThrough();
  return Object.assign(stream, {
    stop: vi.fn(async () => {
      stream.end();
    })
  });
}

describe('PuppeteerUtilsService recorder lifecycle', () => {
  let tempDir: string;
  let service: PuppeteerUtilsService;
  let remux: Mock<
    (ffmpegPath: string, from: string, to: string) => Promise<void>
  >;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tag-check-puppeteer-'));
    service = new PuppeteerUtilsService(
      { getBROWSER_ARGS: vi.fn(() => []) } as never,
      { getRecordingDetails: vi.fn() } as never,
      {
        getInspectionEventFolderPath: vi.fn().mockResolvedValue(tempDir)
      } as never
    );
    // Stands in for ffmpeg: copies the recording and marks the copy.
    remux = vi.fn(async (_ffmpeg: string, from: string, to: string) => {
      await writeFile(to, `${await readFile(from, 'utf8')} +cues`);
    });
    service['remuxRecording'] = remux;
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
      service.startRecorder(
        page as never,
        'project',
        'event',
        controller.signal
      )
    ).rejects.toThrow(/aborted/i);
    expect(page.screencast).not.toHaveBeenCalled();
  });

  it('stops and rejects when abort happens while screencast is starting', async () => {
    const controller = new AbortController();
    const recorder = fakeRecorder();
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

    const promise = service.startRecorder(
      page as never,
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
    const recorder = fakeRecorder();
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockResolvedValue(recorder)
    };

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
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockResolvedValue(recorder)
    };

    await service.startRecorder(
      page as never,
      'project',
      'event',
      controller.signal
    );
    controller.abort();

    await vi.waitFor(() => expect(recorder.stop).toHaveBeenCalledTimes(1));
    // The abort path finalizes the file too; let it finish before cleanup.
    // vi.waitFor gives up after 1 s by default, too soon under parallel runs.
    await vi.waitFor(
      async () =>
        expect(await readFile(join(tempDir, 'recording.webm'), 'utf8')).toBe(
          ' +cues'
        ),
      { timeout: 10_000 }
    );
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
      service.startRecorder(
        page as never,
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

    await service.stopRecorder(firstRecorder as never);

    expect(firstRecorder.stop).toHaveBeenCalledTimes(1);
    expect(secondRecorder.stop).not.toHaveBeenCalled();
  });

  it('writes the screencast to recording.webm and remuxes it in place when stopped', async () => {
    const recorder = fakeRecorder();
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockResolvedValue(recorder)
    };
    const file = join(tempDir, 'recording.webm');

    await service.startRecorder(page as never, 'project', 'event');
    recorder.write('frames');
    await service.stopRecorder(recorder as never);

    expect(page.screencast).toHaveBeenCalledWith({
      ffmpegPath: expect.any(String)
    });
    expect(remux).toHaveBeenCalledWith(
      expect.any(String),
      file,
      `${file}.remux.webm`
    );
    expect(await readFile(file, 'utf8')).toBe('frames +cues');
    expect(await readdir(tempDir)).toEqual(['recording.webm']);
  });

  it('keeps the streamed recording when the remux fails', async () => {
    remux.mockRejectedValue(new Error('ffmpeg exited with code 1'));
    const recorder = fakeRecorder();
    const page = {
      bringToFront: vi.fn(),
      viewport: vi.fn(() => ({ width: 1400, height: 900 })),
      screencast: vi.fn().mockResolvedValue(recorder)
    };

    await service.startRecorder(page as never, 'project', 'event');
    recorder.write('frames');
    await service.stopRecorder(recorder as never);

    expect(await readFile(join(tempDir, 'recording.webm'), 'utf8')).toBe(
      'frames'
    );
    expect(await readdir(tempDir)).toEqual(['recording.webm']);
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
