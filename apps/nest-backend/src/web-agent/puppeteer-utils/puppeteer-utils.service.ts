/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join } from 'path';
import { Page, Browser, ScreenRecorder, Credentials } from 'puppeteer';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { readFileSync } from 'fs';
import { ConfigsService } from '../../configs/configs.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Injectable()
export class PuppeteerUtilsService {
  private recorder: ScreenRecorder | null = null;

  constructor(
    private filePathService: FilePathService,
    private configsService: ConfigsService
  ) {}

  @Log()
  async startBrowser(
    projectSlug: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    eventInspectionPresetDto: EventInspectionPresetDto,
    signal: AbortSignal
  ) {
    const operationPath = await this.filePathService.getOperationFilePath(
      projectSlug,
      eventId
    );
    const operationContent = JSON.parse(readFileSync(operationPath, 'utf8'));
    const viewportStep = operationContent.steps.find(
      (step: { type: string }) => step.type === 'setViewport'
    );
    const viewportHeight = viewportStep.height;
    const viewportWidth = viewportStep.width;
    Logger.log(`Viewport: ${viewportWidth}x${viewportHeight}`);
    // TODO: cannot customize viewport
    const defaultViewport = {
      width: Number(viewportWidth),
      height: Number(viewportHeight),
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser: Browser = await stats.puppeteer.launch({
      headless: headless === 'true' ? true : false,
      devtools: !!measurementId,
      acceptInsecureCerts: true,
      args:
        eventInspectionPresetDto.puppeteerArgs ||
        this.configsService.getBROWSER_ARGS(),
      executablePath: stats.executablePath,
      defaultViewport: { width: 1400, height: 900 },
      signal: signal,
    });

    const pages = await browser.pages();
    const page = pages[0];
    try {
      // Set up an abort listener
      signal.addEventListener('abort', async () => {
        Logger.log(
          'Received the abort signal',
          `${PuppeteerUtilsService.name}.${this.startBrowser.name}`
        );
        await this.cleanup(browser, page);
      });

      return {
        browser: browser,
        page: page,
      };
    } catch (error) {
      Logger.error(
        `Error starting browser: ${error}`,
        `${PuppeteerUtilsService.name}.${this.startBrowser.name}`
      );
      await this.cleanup(browser, page);
      throw error;
    }
  }

  @Log('Clean up resources')
  async cleanup(browser: Browser, page: Page) {
    if (this.recorder) {
      await this.stopRecorder();
    }

    if (page) {
      await page
        .close()
        .catch((err) =>
          Logger.error(
            `Error closing page: ${err}`,
            `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.cleanup.name}`
          )
        );
    }

    if (browser) {
      await browser
        .close()
        .catch((err) =>
          Logger.error(
            `Error closing browser: ${err}`,
            `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.cleanup.name}`
          )
        );
    }
  }

  @Log()
  async startRecorder(page: Page, folderPath: string): Promise<ScreenRecorder> {
    const recordingPath = join(folderPath, 'recording');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegPath = require('ffmpeg-static');
    await page.bringToFront();
    this.recorder = await page.screencast({
      ffmpegPath: ffmpegPath,
      path: `${recordingPath}.webm`,
    });
    return this.recorder;
  }

  @Log()
  async stopRecorder() {
    if (this.recorder) {
      await this.recorder.stop();
      this.recorder = null;
    }
  }
}
