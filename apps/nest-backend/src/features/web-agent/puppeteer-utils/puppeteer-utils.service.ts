import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join } from 'path';
import { Page, Browser, ScreenRecorder } from 'puppeteer';
import { ConfigsService } from '../../../core/configs/configs.service';

@Injectable()
export class PuppeteerUtilsService {
  private readonly logger = new Logger(PuppeteerUtilsService.name);
  private recorder: ScreenRecorder | null = null;

  constructor(private readonly configsService: ConfigsService) {}

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

    const browser: Browser = await stats.puppeteer.launch({
      headless: headlessFlag,
      // enable devtools when measurementId present (useful for debugging)
      devtools: !!measurementId,
      acceptInsecureCerts: true,
      args:
        eventInspectionPresetDto.puppeteerArgs &&
        eventInspectionPresetDto.puppeteerArgs.length > 0
          ? eventInspectionPresetDto.puppeteerArgs
          : this.configsService.getBROWSER_ARGS(),
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

  async cleanup(browser: Browser, page: Page) {
    if (this.recorder) {
      await this.stopRecorder();
    }

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

  async startRecorder(page: Page, folderPath: string): Promise<ScreenRecorder> {
    const recordingPath = join(folderPath, 'recording');
    const ffmpegPath = require('ffmpeg-static');
    await page.bringToFront();
    this.recorder = await page.screencast({
      ffmpegPath: ffmpegPath,
      path: `${recordingPath}.webm`
    });
    return this.recorder;
  }

  async stopRecorder() {
    if (this.recorder) {
      await this.recorder.stop();
      this.recorder = null;
    }
  }
}
