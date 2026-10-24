import { Page } from 'puppeteer';
import { getFirstSelector } from '../handlers/utils';
import { EventInspectionPresetDto } from '../../../../shared/dto/event-inspection-preset.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataLayerService } from '../../action/web-monitoring/data-layer/data-layer.service';
import { ConfigsService } from '../../../../core/configs/configs.service';
import { Step } from '@utils';
import { preloadApplicationLocalStorage } from '../../browser-state-preload.util';

/** Replay state shared across the steps of one recording. */
export interface StepReplayState {
  isFirstNavigation: boolean;
}

/** Chrome Recorder navigate steps carry the URL to open. */
function navigateUrl(step: Step): string {
  if (step.url === undefined) {
    throw new Error(`Step "${step.type}" has no url to navigate to`);
  }
  return step.url;
}

/** The step handlers that StepExecutorService runs itself. */
@Injectable()
export class StepExecutorUtilsService {
  private readonly logger = new Logger(StepExecutorUtilsService.name);
  constructor(
    private readonly dataLayerService: DataLayerService,
    private readonly configsService: ConfigsService
  ) {}

  /**
   * After a key-up: on the last step, waits up to `delay` for the navigation
   * the key may have started; then snapshots the dataLayer.
   */
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

  /**
   * On the last step only: waits up to `delay` for a navigation, then 2 s
   * more for the new page's tags. Never throws; most steps do not navigate.
   */
  async handleNavigationIfNeeded(
    page: Page,
    isLastStep: boolean,
    delay = 10000
  ): Promise<void> {
    if (isLastStep) {
      try {
        await page.waitForNavigation({ timeout: delay });
      } catch (error) {
        this.logger.warn(
          `Navigation timeout: ${JSON.stringify(error, null, 2)}`
        );
        this.logger.error(`No Navigation needed`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async handleSetViewport(page: Page, step: Step): Promise<void> {
    await page.setViewport({ width: step.width, height: step.height });
  }

  /**
   * Opens the step's URL. The replay's first navigation also sets the
   * configured user agent and the preset's localStorage, and loads the page
   * twice (see handleFirstNavigation).
   */
  async handleNavigate(
    page: Page,
    step: Step,
    state: StepReplayState,
    isLastStep: boolean,
    application: EventInspectionPresetDto['application']
  ): Promise<void> {
    if (state.isFirstNavigation) {
      const ua = this.configsService.getUSER_AGENT();

      // set the User-Agent HTTP header for outgoing requests
      await page.setExtraHTTPHeaders({ 'user-agent': ua });

      // ensure scripts see the same userAgent value by overriding navigator.userAgent on new documents.
      // Helper-free on purpose: swc compiles this function to ES5 for the
      // page, which has none of the bundle's helpers (see AGENTS.md).
      await page.evaluateOnNewDocument((userAgentValue) => {
        Object.defineProperty(navigator, 'userAgent', {
          get() {
            return userAgentValue;
          }
        });
      }, ua);

      await this.handleFirstNavigation(page, step, state, application);
    } else {
      await page.goto(navigateUrl(step), { waitUntil: 'networkidle2' });
    }
    await this.handleNavigationIfNeeded(page, isLastStep, 2000);
  }

  /**
   * Resolves once one of the step's selectors appears, or the page
   * navigates, each selector waited for up to `timeout` in turn. Throws
   * NotFoundException when none does.
   */
  async handleWaitForElement(page: Page, step: Step, timeout: number) {
    for (const selector of step.selectors ?? []) {
      try {
        // sometimes SSR may send multiple SPA pages, so it's necessary to wait for navigation
        // but sometimes it's not necessary, so we do race
        const firstSelector = getFirstSelector(selector);
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'load', timeout }),
          page.waitForSelector(firstSelector, {
            visible: step.visible === true,
            timeout: timeout
          })
        ]);
        return;
      } catch (error) {
        this.logger.warn(
          `Failed to find selector: ${selector}, error: ${JSON.stringify(error, null, 2)}`
        );
        this.logger.error(`Failed to find selector: ${selector}`);
      }
    }
    // The page stays open: the pipeline still takes the failed run's
    // screenshot, and the caller decides whether the browser closes.
    throw new NotFoundException(
      'Failed to find any of the specified selectors'
    );
  }

  /**
   * Logs the consent preferences and cookies the page sees after the first
   * navigation. Diagnostic only: a value it cannot read is logged, and the
   * run goes on.
   */
  private async verifyLocalStorageAndCookies(page: Page): Promise<void> {
    try {
      // Helper-free on purpose: swc compiles this function to ES5 for the
      // page, which has none of the bundle's helpers (see AGENTS.md).
      const finalCheck = await page.evaluate(() => {
        const localStorageData =
          localStorage.getItem('consentPreferences') || '{}';
        const cookiesData = document.cookie;
        const parsedLocalStorage = JSON.parse(localStorageData);
        return { parsedLocalStorage, cookiesData };
      });

      this.logger.log(`Final check: ${JSON.stringify(finalCheck, null, 2)}`);
    } catch (error) {
      this.logger.warn(
        `Could not read the consent preferences and cookies: ${error}`
      );
    }
  }

  /**
   * Registers the preset's localStorage, then loads the page twice, so the
   * replay starts as a returning visit: with the storage and cookies that
   * the first load and the preset wrote.
   */
  private async handleFirstNavigation(
    page: Page,
    step: Step,
    state: StepReplayState,
    application: EventInspectionPresetDto['application']
  ): Promise<void> {
    await preloadApplicationLocalStorage(page, application);
    const url = navigateUrl(step);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.goto(url, { waitUntil: 'networkidle2' });
    await this.verifyLocalStorageAndCookies(page);
    state.isFirstNavigation = false;
  }
}
