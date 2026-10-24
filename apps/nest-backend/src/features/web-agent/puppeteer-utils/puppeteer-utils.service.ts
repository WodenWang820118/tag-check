import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { Page, Browser, LaunchOptions } from 'puppeteer';
import { ConfigsService } from '../../../core/configs/configs.service';
import { RecordingRepositoryService } from '../.././../core/repository/recording/recording-repository.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { RECORDING_FILES, RecordingFile } from '../../../shared';
import { RunRecorder } from './run-recorder';

const CLOSE_TIMEOUT_MS = 10_000;

/**
 * Reads the `headless` query flag, which arrives as a string. Only "true" and
 * "1" mean headless; anything else, including a missing value, is headful.
 */
export function isHeadless(headless: string | undefined): boolean {
  return headless === 'true' || headless === '1';
}

/** The Chromium build that puppeteer-chromium-resolver found or downloaded. */
interface ResolvedChromium {
  puppeteer: { launch(options: LaunchOptions): Promise<Browser> };
  executablePath: string;
}

/**
 * Launches and closes the Chromium a run drives, and records its pages.
 *
 * The caller owns the browser that startBrowser returns: it calls cleanup on
 * every path, except a headful run that is left open on purpose so the user
 * can inspect it.
 */
@Injectable()
export class PuppeteerUtilsService {
  private readonly logger = new Logger(PuppeteerUtilsService.name);
  private readonly recorderAbortListeners = new WeakMap<
    RunRecorder,
    { signal: AbortSignal; listener: () => void }
  >();

  constructor(
    private readonly configsService: ConfigsService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly folderPathService: FolderPathService
  ) {}

  /**
   * Launches Chromium and returns it with its first page. Aborting `signal`
   * later closes the browser. A signal aborted while Chromium starts closes
   * the browser and rejects.
   */
  async startBrowser(
    headless: string,
    measurementId: string,
    eventInspectionPresetDto: EventInspectionPresetDto,
    signal: AbortSignal
  ) {
    const stats = await this.resolveChromium();
    const headlessFlag = isHeadless(headless);

    // Merge default browser args with any provided by the preset (last wins per flag)
    const defaultArgs = this.configsService.getBROWSER_ARGS?.() ?? [];
    const providedArgs = eventInspectionPresetDto?.puppeteerArgs ?? [];
    const mergedArgs = this.filterPuppeteerArgs(
      this.mergePuppeteerArgs(defaultArgs, providedArgs)
    );
    this.logger.debug(
      `Launching Chromium with args: ${JSON.stringify(mergedArgs)}`
    );

    const browser: Browser = await stats.puppeteer.launch({
      headless: headlessFlag,
      // Open DevTools for headful GA4 runs so the user can watch the network.
      // Headless runs skip it: nobody sees it, and a tab with DevTools
      // attached never finishes page.close().
      devtools: !headlessFlag && !!measurementId,
      acceptInsecureCerts: true,
      args: mergedArgs,
      executablePath: stats.executablePath,
      defaultViewport: { width: 1400, height: 900 },
      signal: signal
    });

    const [page] = await browser.pages();
    // A signal fires 'abort' only once. An abort that arrived while Chromium
    // was starting would never reach the listener below, and the run would
    // go on in a browser nobody closes.
    if (signal.aborted) {
      await this.cleanup(browser, page);
      throw new Error('Browser start aborted');
    }
    signal.addEventListener(
      'abort',
      () => {
        this.logger.log('Received the abort signal');
        void this.cleanup(browser, page);
      },
      { once: true }
    );

    return { browser, page };
  }

  /**
   * Finds the Chromium build to launch. The resolver is required lazily: it
   * is CommonJS without types and is only needed once a run starts.
   */
  protected async resolveChromium(): Promise<ResolvedChromium> {
    const PCR = require('puppeteer-chromium-resolver');
    return await PCR({});
  }

  /**
   * Stops `recorder`, then closes `page` and `browser`. Never throws: each
   * close is bounded by CLOSE_TIMEOUT_MS, and a browser that does not close
   * in time has its process killed.
   */
  async cleanup(browser: Browser, page: Page, recorder?: RunRecorder | null) {
    await this.stopRecorder(recorder);

    if (page) {
      await this.settleWithin(page.close(), 'closing page');
    }

    if (browser) {
      const closed = await this.settleWithin(
        browser.close(),
        'closing browser'
      );
      if (!closed) {
        browser.process()?.kill('SIGKILL');
      }
    }
  }

  /**
   * Waits for a close call, but never longer than CLOSE_TIMEOUT_MS: a stalled
   * close would otherwise hold the HTTP request open indefinitely.
   * Resolves false when the call timed out.
   */
  private async settleWithin(
    operation: Promise<unknown>,
    action: string
  ): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), CLOSE_TIMEOUT_MS);
    });
    const settled = operation.then(
      () => true as const,
      (err) => {
        this.logger.error(`Error ${action}: ${err}`);
        return true as const;
      }
    );
    const result = await Promise.race([settled, timedOut]);
    clearTimeout(timer);
    if (!result) {
      this.logger.warn(`Gave up ${action} after ${CLOSE_TIMEOUT_MS}ms`);
    }
    return result;
  }

  /**
   * Records `page` to one of the test's recording files (the site recording
   * by default). Starting the site recording removes the previous run's
   * Tag Assistant recording, so a direct run never shows a stale one.
   */
  async startRecorder(
    page: Page,
    projectSlug: string,
    eventId: string,
    signal?: AbortSignal,
    options: { file?: RecordingFile; bringToFront?: boolean } = {}
  ): Promise<RunRecorder> {
    const file = options.file ?? RECORDING_FILES.site;
    if (signal?.aborted) {
      throw new Error('Recording start aborted');
    }

    let recorder: RunRecorder | null = null;
    const abortListener = async () => {
      if (recorder) {
        await this.stopRecorder(recorder);
      }
    };

    const folderPath =
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      );

    const outputFile = join(folderPath, file);

    // Ensure destination directory exists and previous output is cleared
    try {
      await fs.mkdir(dirname(outputFile), { recursive: true });
    } catch (e) {
      this.logger.error(
        `Failed to create recording directory: ${dirname(outputFile)}. Error: ${e}`
      );
      throw e;
    }
    try {
      await fs.rm(outputFile, { force: true });
      if (file === RECORDING_FILES.site) {
        await fs.rm(join(folderPath, RECORDING_FILES.tagAssistant), {
          force: true
        });
      }
    } catch (e) {
      // Non-fatal; proceed if file didn't exist
      this.logger.debug(
        `No previous recording to remove at ${outputFile}: ${e}`
      );
    }

    if (options.bringToFront !== false) {
      await page.bringToFront();
    }
    // Registered here so every failure below removes it again. An abort
    // that arrives before this is caught by the aborted check after start.
    signal?.addEventListener('abort', abortListener);
    try {
      const ffmpegPath: string = require('ffmpeg-static');
      recorder = await RunRecorder.start(page, outputFile, ffmpegPath);

      if (signal) {
        this.recorderAbortListeners.set(recorder, {
          signal,
          listener: abortListener
        });
      }

      if (signal?.aborted) {
        await this.stopRecorder(recorder);
        throw new Error('Recording start aborted');
      }
    } catch (e) {
      this.logger.error(
        `Failed to start screen recording via ffmpeg at ${outputFile}: ${e}`
      );
      signal?.removeEventListener('abort', abortListener);
      throw e;
    }
    return recorder;
  }

  async stopRecorder(recorder?: RunRecorder | null) {
    if (!recorder) return;

    const registration = this.recorderAbortListeners.get(recorder);
    if (registration) {
      registration.signal.removeEventListener('abort', registration.listener);
      this.recorderAbortListeners.delete(recorder);
    }

    // stop() never throws; a failed recording is logged by the recorder.
    await recorder.stop();
  }

  /**
   * Apply recorded viewport dimensions to the provided page, if available and valid.
   * Reads the first step from the stored recording and safely sets the viewport.
   */
  async applyRecordedViewport(
    page: Page,
    projectSlug: string,
    eventId: string
  ): Promise<void> {
    try {
      const operation =
        await this.recordingRepositoryService.getRecordingDetails(
          projectSlug,
          eventId
        );

      const setViewportStep = operation?.steps?.[0];
      const rawWidth = setViewportStep?.width;
      const rawHeight = setViewportStep?.height;
      const parsedWidth = Number(rawWidth);
      const parsedHeight = Number(rawHeight);
      const isValidDim = (n: number) =>
        Number.isFinite(n) && n >= 1 && n <= 8192 && Number.isInteger(n);

      if (!(isValidDim(parsedWidth) && isValidDim(parsedHeight))) {
        this.logger.warn(
          `Recorded viewport is invalid or missing (width=${rawWidth}, height=${rawHeight}). Skipping viewport resize.`
        );
        return;
      }

      // ffmpeg encoders often require even dimensions; normalize to even numbers
      const toEven = (n: number) => (n % 2 === 0 ? n : n + 1);
      const safeWidth = Math.min(8192, Math.max(2, toEven(parsedWidth)));
      const safeHeight = Math.min(8192, Math.max(2, toEven(parsedHeight)));
      if (safeWidth !== parsedWidth || safeHeight !== parsedHeight) {
        this.logger.debug(
          `Adjusting recorded viewport to even dimensions: ${parsedWidth}x${parsedHeight} -> ${safeWidth}x${safeHeight}`
        );
      }

      try {
        await page.bringToFront();
      } catch (e) {
        this.logger.debug(
          `bringToFront before resize failed (non-fatal): ${e}`
        );
      }

      const currentViewport = page.viewport?.();
      const needsResize =
        currentViewport?.width !== safeWidth ||
        currentViewport?.height !== safeHeight;

      if (!needsResize) return;

      this.logger.log(
        `Setting viewport to recorded size: ${safeWidth}x${safeHeight}`
      );
      try {
        await page.setViewport({
          width: safeWidth,
          height: safeHeight,
          deviceScaleFactor: 1
        });
        this.logger.log(`Viewport configured: ${safeWidth}x${safeHeight}`);
      } catch (e) {
        this.logger.warn(
          `Failed to set viewport to recorded size; continuing with default. Error: ${e}`
        );
      }
    } catch (e) {
      this.logger.warn(
        `Failed to apply recorded viewport (non-fatal). Error: ${e}`
      );
    }
  }

  /**
   * Merge Puppeteer args arrays so that defaults are included but any provided args override them.
   * Dedupe by flag key (e.g., --foo, --bar=val) with last occurrence winning.
   */
  private mergePuppeteerArgs(
    defaultArgs: string[],
    providedArgs: string[]
  ): string[] {
    const combined = [...(defaultArgs || []), ...(providedArgs || [])];
    if (combined.length === 0) return [];

    const seen = new Set<string>();
    const result: string[] = [];

    // iterate from right to left to keep last occurrence
    for (let i = combined.length - 1; i >= 0; i--) {
      const arg = combined[i];
      if (!arg) continue;
      const key = arg.startsWith('-') ? arg.split('=')[0] : arg;
      if (!seen.has(key)) {
        seen.add(key);
        // unshift to restore original rightmost-first order
        result.unshift(arg);
      }
    }
    return result;
  }

  private filterPuppeteerArgs(args: string[]): string[] {
    const dangerousFlags = new Set([
      '--remote-debugging-port',
      '--remote-debugging-address',
      '--user-data-dir',
      '--profile-directory',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--load-extension',
      '--disable-extensions-except',
      '--host-resolver-rules',
      '--proxy-server',
      '--proxy-pac-url'
    ]);

    const filtered: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg !== 'string') continue;

      const trimmed = arg.trim();
      const key = trimmed.split('=')[0].toLowerCase();
      if (dangerousFlags.has(key)) {
        if (!trimmed.includes('=')) {
          const next = args[i + 1]?.trim();
          if (next && !next.startsWith('-')) {
            i++;
          }
        }
        this.logger.warn(`Dropping unsafe Chromium arg: ${key}`);
        continue;
      }

      filtered.push(arg);
    }

    return filtered;
  }
}
