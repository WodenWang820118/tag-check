import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Page } from 'puppeteer';
import { sleep } from './action-utils';
import { getFirstSelector } from './handlers/utils';
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';

export async function handleKeyboardAction(
  page: Page,
  projectName: string,
  eventId: string,
  isLastStep: boolean,
  delay: number
) {
  await this.handleNavigationIfNeeded(page, isLastStep, delay);
  await this.dataLayerService.updateSelfDataLayer(page, projectName, eventId);
}

export async function handleNavigationIfNeeded(
  page: Page,
  isLastStep: boolean,
  delay = 10000
) {
  if (isLastStep) {
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: delay,
      });
    } catch (error) {
      Logger.log(
        'No navigation needed',
        `${this.name}.handleNavigationIfNeeded`
      );
    }
  }
  await sleep(1000); // Necessary delay for the website to update
}

export async function handleSetViewport(page: Page, step: any) {
  await page.setViewport({
    width: step.width,
    height: step.height,
  });
}

export async function handleNavigate(
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
          Logger.log(setting, `${this.name}`); // Assuming you have a way to log from here
          const value =
            typeof setting.value === 'object'
              ? JSON.stringify(setting.value)
              : setting.value;
          Logger.log(
            `Setting localStorage ${setting.key}=${value}`,
            `${this.name}`
          ); // Assuming you have a way to log from here
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
      Logger.log(
        `Reload the page with the final URL ${finalUrl}`,
        `${this.name}`
      );
      await page.goto(finalUrl);
      await sleep(1000); // Necessary delay for the website to update
      state.isFirstNavigation = false;
    }
  } catch (error) {
    Logger.error(error, `${this.name}.handleNavigate`);
    throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function handleWaitForElement(
  page: Page,
  step: any,
  timeout: number
) {
  for (const selector of step.selectors) {
    try {
      // sometimes SSR may send multiple SPA pages, so it's necessary to wait for navigation
      // but sometimes it's not necessary, so we do race
      const fistSelector = getFirstSelector(selector);
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout }),
        page.waitForSelector(fistSelector, {
          visible: step.visible ? true : false,
          timeout: timeout,
        }),
      ]);

      Logger.log(`${selector} exists`, `${this.name}`);
      return;
    } catch (error) {
      Logger.error(`${selector} does not exist`, `${this.name}`);
      // close the page if stop processing
      await page.close();
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
