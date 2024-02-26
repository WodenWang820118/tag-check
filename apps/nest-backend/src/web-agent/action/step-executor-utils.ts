import { Logger, HttpException } from '@nestjs/common';
import { Page } from 'puppeteer';
import { sleep } from './action-utils';
import { getFirstSelector } from './handlers/utils';

export async function handleKeyboardAction(
  page: Page,
  projectName: string,
  testName: string,
  isLastStep: boolean,
  delay: number
) {
  await this.handleNavigationIfNeeded(page, isLastStep, delay);
  await this.dataLayerService.updateSelfDataLayer(page, projectName, testName);
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
      Logger.log('No navigation needed', 'StepExecutor.executeStep');
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
  application?: any
) {
  const settings = application;
  // no need to wait for idle network state since sometimes there are sliders or carousels
  await page.goto(step.url);

  await sleep(1000); // Necessary delay for the website to update

  // pre-load the application localStorage if any
  if (settings.application && settings.application.localStorage) {
    await page.evaluate((appLocalStorage) => {
      for (const setting of appLocalStorage.data) {
        // Correctly access the value property of each setting object
        console.log(setting, 'StepExecutor.handleNavigate - setting');
        const value =
          typeof setting.value === 'object'
            ? JSON.stringify(setting.value)
            : setting.value;
        console.log(`Setting localStorage ${setting.key}=${value}`); // Assuming you have a way to log from here
        localStorage.setItem(setting.key, value);
      }
    }, settings.application.localStorage); // Pass application.localStorage as an argument to the evaluate function
  }

  // pre-load the application cookies if any
  if (settings.application.cookie && settings.application.cookie.data) {
    await page.setCookie(...settings.application.cookie.data);
  }

  // then reload the page to make sure the localStorage and cookies are set
  // try to skip the overlay or popups
  if (state.isFirstNavigation) {
    // only reload the landing page, trying to skip the overlay
    await page.reload();
    await sleep(1000); // Necessary delay for the website to update
    state.isFirstNavigation = false;
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

      Logger.log(`${selector} exists`, 'StepExecutor.handleWaitForElement');
      return;
    } catch (error) {
      Logger.log(
        `${selector} does not exist`,
        'StepExecutor.handleWaitForElement'
      );
      Logger.error(error.message, 'StepExecutor.handleWaitForElement');
      // close the page if stop processing
      await page.close();
      throw new HttpException(`${error.message}, Stop processing.`, 500);
    }
  }
}
