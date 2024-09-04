/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join } from 'path';
import { Page, Browser, ScreenRecorder, Credentials } from 'puppeteer';
import { BROWSER_ARGS } from '../../configs/project.config';

@Injectable()
export class PuppeteerUtilsService {
  private recorder: ScreenRecorder | null = null;

  async startBrowser(
    projectSlug: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    eventInspectionPresetDto: EventInspectionPresetDto,
    signal: AbortSignal
  ) {
    Logger.log(
      `Signal: ${JSON.stringify(signal, null, 2)}`,
      `${PuppeteerUtilsService.name}.${this.startBrowser.name}`
    );
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser: Browser = await stats.puppeteer.launch({
      headless: headless === 'true' ? true : false,
      devtools: !!measurementId,
      acceptInsecureCerts: true,
      args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
      executablePath: stats.executablePath,
      defaultViewport: { width: 1920, height: 1080 },
      signal: signal,
    });

    Logger.log(
      'Browser launched',
      `${PuppeteerUtilsService.name}.${this.startBrowser.name}`
    );

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

  async cleanup(browser: Browser, page: Page) {
    Logger.log(
      'Cleaning up resources',
      `${PuppeteerUtilsService.name}.${this.cleanup.name}`
    );

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

  async startRecorder(page: Page, folderPath: string): Promise<ScreenRecorder> {
    Logger.log(
      `Recorder started`,
      `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.startRecorder.name}`
    );
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

  async stopRecorder() {
    Logger.log(
      'Recorder stopped',
      `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.stopRecorder.name}`
    );
    if (this.recorder) {
      await this.recorder.stop();
      this.recorder = null;
    }
  }
}
