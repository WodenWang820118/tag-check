import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
@Injectable()
export class WebAgentService {
  constructor(private webAgentUtilsService: WebAgentUtilsService) {}

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

  async fetchDataLayer(url: string, credentials?: Credentials) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    Logger.log(stats, 'WebAgentService.fetchDataLayer: stats');
    const browser = await stats.puppeteer.launch({
      headless: true,
      args: BROWSER_ARGS,
      executablePath: stats.executablePath,
    });

    const [page] = await browser.pages();

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
}
