/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join } from 'path';
import { Page, Browser, ScreenRecorder } from 'puppeteer';
import { ConfigsService } from '../../../core/configs/configs.service';

@Injectable()
export class PuppeteerUtilsService {
  private readonly logger = new Logger(PuppeteerUtilsService.name);
  private recorder: ScreenRecorder | null = null;

  constructor(private configsService: ConfigsService) {}

  async startBrowser(
    headless: string,
    measurementId: string,
    eventInspectionPresetDto: EventInspectionPresetDto,
    signal: AbortSignal
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser: Browser = await stats.puppeteer.launch({
      headless: headless ? true : false,
      devtools: !!measurementId,
      acceptInsecureCerts: true,
      args:
        eventInspectionPresetDto.puppeteerArgs ||
        this.configsService.getBROWSER_ARGS(),
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
