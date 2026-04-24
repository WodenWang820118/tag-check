import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { Page, Browser, ScreenRecorder } from 'puppeteer';
import { ConfigsService } from '../../../core/configs/configs.service';
import { RecordingRepositoryService } from '../.././../core/repository/recording/recording-repository.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';

@Injectable()
export class PuppeteerUtilsService {
  private readonly logger = new Logger(PuppeteerUtilsService.name);
  private readonly recorderAbortListeners = new WeakMap<
    ScreenRecorder,
    { signal: AbortSignal; listener: () => void }
  >();

  constructor(
    private readonly configsService: ConfigsService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly folderPathService: FolderPathService
  ) {}

  async startBrowser(
    headless: string,
    measurementId: string,
    eventInspectionPresetDto: EventInspectionPresetDto,
    signal: AbortSignal
  ) {
    const PCR = require('puppeteer-chromium-resolver');

    const options = {};
    const stats = await PCR(options);
    // normalize headless flag: callers may pass string 'true'/'false'
    const headlessFlag = headless === 'true' || headless === '1';

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
      // enable devtools when measurementId present (useful for debugging)
      devtools: !!measurementId,
      acceptInsecureCerts: true,
      args: mergedArgs,
      executablePath: stats.executablePath,
      defaultViewport: { width: 1400, height: 900 },
      signal: signal
    });

    const pages = await browser.pages();
    const page = pages[0];
    try {
      // Set up an abort listener
      signal.addEventListener('abort', async () => {
        this.logger.log('Received the abort signal');
        await this.cleanup(browser, page);
      });

      return {
        browser: browser,
        page: page
      };
    } catch (error) {
      this.logger.error(`Error starting browser: ${error}`);
      await this.cleanup(browser, page);
      throw error;
    }
  }

  async cleanup(
    browser: Browser,
    page: Page,
    recorder?: ScreenRecorder | null
  ) {
    await this.stopRecorder(recorder);

    if (page) {
      await page
        .close()
        .catch((err) => this.logger.error(`Error closing page: ${err}`));
    }

    if (browser) {
      await browser
        .close()
        .catch((err) => this.logger.error(`Error closing browser: ${err}`));
    }
  }

  async startRecorder(
    page: Page,
    projectSlug: string,
    eventId: string,
    signal?: AbortSignal
  ): Promise<ScreenRecorder> {
    if (signal?.aborted) {
      throw new Error('Recording start aborted');
    }

    let recorder: ScreenRecorder | null = null;
    const abortListener = async () => {
      if (recorder) {
        await this.stopRecorder(recorder);
      }
    };
    signal?.addEventListener('abort', abortListener);

    const folderPath =
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      );

    const recordingPath = join(folderPath, 'recording');
    const outputFile = `${recordingPath}.webm`;

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
    } catch (e) {
      // Non-fatal; proceed if file didn't exist
      this.logger.debug(
        `No previous recording to remove at ${outputFile}: ${e}`
      );
    }

    await page.bringToFront();
    try {
      const ffmpegPath = require('ffmpeg-static');

      // Ensure current viewport has even dimensions to avoid ffmpeg errors
      try {
        const vp = page.viewport?.();
        const toEven = (n: number) => (n % 2 === 0 ? n : n + 1);
        if (vp && (vp.width % 2 !== 0 || vp.height % 2 !== 0)) {
          const evenWidth = toEven(vp.width);
          const evenHeight = toEven(vp.height);
          this.logger.debug(
            `Normalizing viewport to even dimensions for recording: ${vp.width}x${vp.height} -> ${evenWidth}x${evenHeight}`
          );
          await page.setViewport({
            width: evenWidth,
            height: evenHeight,
            deviceScaleFactor: 1
          });
        }
      } catch (e) {
        this.logger.debug(
          `Failed to normalize viewport before recording (non-fatal): ${e}`
        );
      }

      recorder = await page.screencast({
        ffmpegPath: ffmpegPath,
        path: `${recordingPath}.webm`
      });

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

  async stopRecorder(recorder?: ScreenRecorder | null) {
    if (!recorder) return;

    const registration = this.recorderAbortListeners.get(recorder);
    if (registration) {
      registration.signal.removeEventListener('abort', registration.listener);
      this.recorderAbortListeners.delete(recorder);
    }

    try {
      await recorder.stop();
    } catch (err) {
      this.logger.warn(`Error stopping recorder: ${err}`);
    }
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
        !currentViewport ||
        currentViewport.width !== safeWidth ||
        currentViewport.height !== safeHeight;

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
