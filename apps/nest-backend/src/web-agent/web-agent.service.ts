import { Injectable } from '@nestjs/common';
import puppeteer, { Credentials, Page } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { InspectEventDto } from '../dto/inspect-event.dto';
@Injectable()
export class WebAgentService {
  constructor(private webAgentUtilsService: WebAgentUtilsService) {}

  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    testName: string,
    credentials?: Credentials,
    application?: InspectEventDto['application']
  ) {
    const { dataLayer, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        testName,
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
    const browser = await puppeteer.launch({
      headless: true,
      args: BROWSER_ARGS,
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
    application?: InspectEventDto['application']
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
