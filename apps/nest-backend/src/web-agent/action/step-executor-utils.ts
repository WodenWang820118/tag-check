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

export async function handleNavigate(page: Page, step: any, state: any) {
  await page.goto(step.url, { waitUntil: 'networkidle2' });

  if (state.isFirstNavigation) {
    // only reload the landing page, trying to skip the overlay
    await page.reload({
      waitUntil: 'networkidle2',
    });
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
