import { Page, ScreenRecorder } from 'puppeteer';
import { sleep } from '../action-utils';
import { getFirstSelector } from '../handlers/utils';
import { EventInspectionPresetDto } from '../../../dto/event-inspection-preset.dto';
import { Injectable } from '@nestjs/common';
import { DataLayerService } from '../../action/web-monitoring/data-layer/data-layer.service';

@Injectable()
export class StepExecutorUtilsService {
  recorder!: ScreenRecorder;

  constructor(private dataLayerService: DataLayerService) {}
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
  ) {
    if (isLastStep) {
      try {
        await page.waitForNavigation({
          timeout: delay,
        });
      } catch (error) {
        // throw error will stop the whole process
        console.log(
          'pure function handleNavigationIfNeeded: No Navigation needed'
        );
      }
    }
    await sleep(1000); // Necessary delay for the website to update
  }

  async handleSetViewport(page: Page, step: any) {
    await page.setViewport({
      width: step.width,
      height: step.height,
    });
  }

  async handleNavigate(
    page: Page,
    step: any,
    state: any,
    application: EventInspectionPresetDto['application']
  ) {
    try {
      await page.goto(step.url);
      const finalUrl = page.url();

      await sleep(1000); // Necessary delay for the website to update
      // pre-load the application localStorage if any
      if (application && application.localStorage) {
        await page.evaluate((appLocalStorage) => {
          for (const setting of appLocalStorage.data) {
            // Correctly access the value property of each setting object
            const value =
              typeof setting.value === 'object'
                ? JSON.stringify(setting.value)
                : setting.value;
            localStorage.setItem(setting.key, value);
          }
        }, application.localStorage); // Pass application.localStorage as an argument to the evaluate function
      }

      // pre-load the application cookies if any
      if (application.cookie && application.cookie.data) {
        const cookies = application.cookie.data.map((cookie) => ({
          name: cookie.key.toString(),
          value: cookie.value.toString(),
        }));

        await page.setCookie(...cookies);
      }

      // then reload the page to make sure the localStorage and cookies are set
      // try to skip the overlay or popups
      if (state.isFirstNavigation) {
        // only reload the landing page, trying to skip the overlay
        // Reload the page with the final URL to apply localStorage and cookies
        await page.goto(finalUrl);
        await sleep(1000); // Necessary delay for the website to update
        state.isFirstNavigation = false;
      }
    } catch (error) {
      throw new Error(String(error));
    }
  }

  async handleWaitForElement(page: Page, step: any, timeout: number) {
    for (const selector of step.selectors) {
      try {
        // sometimes SSR may send multiple SPA pages, so it's necessary to wait for navigation
        // but sometimes it's not necessary, so we do race
        const fistSelector = getFirstSelector(selector);
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'load', timeout }),
          page.waitForSelector(fistSelector, {
            visible: step.visible ? true : false,
            timeout: timeout,
          }),
        ]);

        // Logger.log(`${selector} exists`, `handleWaitForElement`);
        return;
      } catch (error) {
        await page.close();
        throw new Error(String(error));
      }
    }
  }
}
