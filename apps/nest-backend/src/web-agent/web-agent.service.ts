import { Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials, Page } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
@Injectable()
export class WebAgentService {
  constructor(private webAgentUtilsService: WebAgentUtilsService) {}
  private currentBrowser: Browser | null = null;
  private currentPage: Page | null = null;
  private abortController: AbortController | null = null;

  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    eventId: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
  ) {
    const { dataLayer, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        eventId,
        false,
        null,
        credentials,
        application
      );
    return {
      dataLayer,
      destinationUrl,
    };
  }

  // TODO: might remove the following method and its usages
  async fetchDataLayer(url: string, credentials?: Credentials) {
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser = await stats.puppeteer.launch({
      headless: true,
      args: BROWSER_ARGS,
      executablePath: stats.executablePath,
      signal: signal,
    });

    const [page] = await browser.pages();

    // Set up an abort listener
    signal.addEventListener(
      'abort',
      async () => {
        await this.cleanup();
      },
      { once: true }
    );

    if (credentials) {
      await page.authenticate({
        username: credentials.username,
        password: credentials.password,
      });
    }
    await page.goto(url, { waitUntil: 'networkidle2' });

    const result = await page.evaluate(() => {
      return window.dataLayer
        ? JSON.parse(JSON.stringify(window.dataLayer))
        : [];
    });

    await browser.close();
    return result;
  }

  async executeAndGetDataLayerAndRequest(
    page: Page,
    projectName: string,
    testName: string,
    measurementId?: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
  ) {
    const { dataLayer, eventRequest, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        testName,
        true,
        measurementId,
        credentials,
        application
      );
    return {
      dataLayer,
      eventRequest,
      destinationUrl,
    };
  }

  stopOperation() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async cleanup() {
    Logger.log(
      'Cleaning up resources',
      `${WebAgentService.name}.${WebAgentService.prototype.cleanup.name}`
    );
    if (this.currentBrowser) {
      try {
        // Close all pages
        const pages = await this.currentBrowser.pages();
        await Promise.all(pages.map((page) => page.close()));
        await this.currentBrowser.close();
      } catch (err) {
        Logger.error(
          err,
          `${WebAgentService.name}.${WebAgentService.prototype.cleanup.name}`
        );
      } finally {
        this.currentBrowser = null;
        this.currentPage = null;
        this.abortController = null;
      }
    }
  }
}
