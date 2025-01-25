/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Page } from 'puppeteer';
import { getFirstSelector } from '../handlers/utils';
import { EventInspectionPresetDto } from '../../../dto/event-inspection-preset.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataLayerService } from '../../action/web-monitoring/data-layer/data-layer.service';
import { ConfigsService } from '../../../core/configs/configs.service';
import { Step } from '@utils';

@Injectable()
export class StepExecutorUtilsService {
  private readonly logger = new Logger(StepExecutorUtilsService.name);
  constructor(
    private readonly dataLayerService: DataLayerService,
    private readonly configsService: ConfigsService
  ) {}
  async handleKeyboardAction(
    page: Page,
    projectName: string,
    eventId: string,
    isLastStep: boolean,
    delay: number
  ) {
    await this.handleNavigationIfNeeded(page, isLastStep, delay);
    await this.dataLayerService.updateSelfDataLayer(page, projectName, eventId);
  }

  async handleNavigationIfNeeded(
    page: Page,
    isLastStep: boolean,
    delay = 10000
  ): Promise<void> {
    if (isLastStep) {
      try {
        await page.waitForNavigation({ timeout: delay });
      } catch (error) {
        this.logger.error(`No Navigation needed`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async handleSetViewport(page: Page, step: any): Promise<void> {
    await page.setViewport({ width: step.width, height: step.height });
  }

  async handleNavigate(
    page: Page,
    step: Step,
    state: any,
    isLastStep: boolean,
    application: EventInspectionPresetDto['application']
  ): Promise<void> {
    if (state.isFirstNavigation) {
      await page.setUserAgent(this.configsService.getUSER_AGENT());
      await this.handleFirstNavigation(page, step, state, application);
    } else {
      await page.goto(step.url, { waitUntil: 'networkidle2' });
    }
    await this.handleNavigationIfNeeded(page, isLastStep, 2000);
  }

  async handleWaitForElement(page: Page, step: Step, timeout: number) {
    for (const selector of step.selectors) {
      try {
        // sometimes SSR may send multiple SPA pages, so it's necessary to wait for navigation
        // but sometimes it's not necessary, so we do race
        const firstSelector = getFirstSelector(selector);
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'load', timeout }),
          page.waitForSelector(firstSelector, {
            visible: step.visible ? true : false,
            timeout: timeout
          })
        ]);
        return;
      } catch (error) {
        this.logger.error(`Failed to find selector: ${selector}`);
      }
    }
    await page.close();
    throw new NotFoundException(
      'Failed to find any of the specified selectors'
    );
  }

  private async verifyLocalStorageAndCookies(page: Page): Promise<void> {
    const finalCheck = await page.evaluate(() => {
      const localStorageData =
        localStorage.getItem('consentPreferences') || '{}';
      const cookiesData = document.cookie;
      const parsedLocalStorage = JSON.parse(localStorageData);
      return { parsedLocalStorage, cookiesData };
    });

    this.logger.log(`Final check: ${JSON.stringify(finalCheck, null, 2)}`);
  }

  private async handleFirstNavigation(
    page: Page,
    step: Step,
    state: any,
    application: EventInspectionPresetDto['application']
  ): Promise<void> {
    await this.setLocalStorage(page, application);
    await this.setCookies(page, application);
    await page.goto(step.url, { waitUntil: 'networkidle2' });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.goto(step.url, { waitUntil: 'networkidle2' });
    await this.verifyLocalStorageAndCookies(page);
    state.isFirstNavigation = false;
  }

  private async setLocalStorage(
    page: Page,
    application: EventInspectionPresetDto['application']
  ): Promise<void> {
    if (application?.localStorage) {
      await page.evaluateOnNewDocument((appLocalStorage) => {
        for (const setting of appLocalStorage.data) {
          let value = setting.value;
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          localStorage.setItem(setting.key, value);
        }
      }, application.localStorage);
    }
  }

  private async setCookies(
    page: Page,
    application: EventInspectionPresetDto['application']
  ): Promise<void> {
    if (application.cookie?.data) {
      const cookies = application.cookie.data.map((cookie) => ({
        name: cookie.key.toString(),
        value: cookie.value.toString()
        // Add domain, path, etc. if needed
      }));
      await page.setCookie(...cookies);
    }
  }
}
