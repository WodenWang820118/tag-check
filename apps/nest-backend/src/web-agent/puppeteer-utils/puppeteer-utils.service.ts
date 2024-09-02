import { Injectable, Logger } from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { join } from 'path';
import { Page, Browser, ScreenRecorder } from 'puppeteer';
import { BROWSER_ARGS } from '../../configs/project.config';

@Injectable()
export class PuppeteerUtilsService {
  private abortController: AbortController | null = null;

  async startBrowser(
    headless: string,
    eventInspectionPresetDto: EventInspectionPresetDto,
    measurementId?: string
  ) {
    const abortController = new AbortController();
    const { signal } = abortController;
    this.abortController = abortController;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser = await stats.puppeteer.launch({
      headless: headless === 'true' ? true : false,
      defaultViewport: null,
      devtools: measurementId ? true : false,
      acceptInsecureCerts: true,
      args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
      executablePath: stats.executablePath,
      signal: signal,
      protocol: 'cdp',
      protocolTimeout: 30000,
    });
    Logger.log(
      'Browser launched',
      `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.startBrowser.name}`
    );

    const [page]: [Page] = await browser.pages();
    // Set up an abort listener
    signal.addEventListener(
      'abort',
      async () => {
        await this.cleanup(browser, page);
      },
      { once: true }
    );
    return { browser, page, abortController };
  }

  async cleanup(browser: Browser, page: Page) {
    Logger.log(
      'Cleaning up resources',
      `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.cleanup.name}`
    );
    if (page) {
      await page
        .close()
        .catch((err) =>
          Logger.error(
            'Error closing page' + err,
            `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.cleanup.name}`
          )
        );
    }
    if (browser) {
      await browser
        .close()
        .catch((err) =>
          Logger.error(
            'Error closing browser' + err,
            `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.cleanup.name}`
          )
        );
    }
  }

  async startRecorder(page: Page, folderPath: string): Promise<ScreenRecorder> {
    const recordingPath = join(folderPath, 'recording');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegPath = require('ffmpeg-static');
    Logger.log(`${JSON.stringify(page, null, 2)}`, 'page');
    Logger.log(`${recordingPath}`, 'recordingPath');
    Logger.log(`${ffmpegPath}`, 'ffmpegPath');
    const recorder = await page.screencast({
      ffmpegPath: ffmpegPath,
      path: `${recordingPath}.webm`,
    });
    return recorder;
  }

  stopOperation() {
    Logger.log(
      'Operation stopped',
      `${PuppeteerUtilsService.name}.${PuppeteerUtilsService.prototype.stopOperation.name}`
    );
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
