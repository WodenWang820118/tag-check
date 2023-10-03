import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { UtilitiesService } from '../utilities/utilities.service';
import {
  CSSClickStrategy,
  ClickStrategy,
  PierceClickStrategy,
  TextClickStrategy,
  XPathClickStrategy,
} from './strategies/click-strategy';
import {
  AriaChangeStrategy,
  CSSChangeStrategy,
  ChangeStrategy,
  PiercingChangeStrategy,
  XpathChangeStrategy,
} from './strategies/change-strategy';
import { SelectorType, getSelectorType } from './action-utilities';
import {
  CSSHoverStrategy,
  HoverStrategy,
  XPathHoverStrategy,
  TextHoverStrategy,
  PierceHoverStrategy,
  AriaHoverStrategy,
} from './strategies/hover-strategy';
import { WebMonitoringService } from '../web-monitoring/web-monitoring.service';

enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
  CHANGE = 'change',
  HOVER = 'hover',
  KEYDOWN = 'keyDown',
  KEYUP = 'keyUp',
}

@Injectable()
export class ActionService {
  private clickStrategies: { [key: string]: ClickStrategy };
  private changeStrategies: { [key: string]: ChangeStrategy };
  private hoverStrategies: { [key: string]: HoverStrategy };

  constructor(
    private utilitiesService: UtilitiesService,
    private webMonitoringService: WebMonitoringService
  ) {
    this.clickStrategies = {
      [SelectorType.CSS]: new CSSClickStrategy(),
      [SelectorType.XPATH]: new XPathClickStrategy(),
      [SelectorType.PIERCE]: new PierceClickStrategy(),
      [SelectorType.TEXT]: new TextClickStrategy(),
    };

    this.changeStrategies = {
      [SelectorType.CSS]: new CSSChangeStrategy(),
      [SelectorType.XPATH]: new XpathChangeStrategy(),
      [SelectorType.PIERCE]: new PiercingChangeStrategy(),
      [SelectorType.ARIA]: new AriaChangeStrategy(),
    };

    this.hoverStrategies = {
      [SelectorType.CSS]: new CSSHoverStrategy(),
      [SelectorType.XPATH]: new XPathHoverStrategy(),
      [SelectorType.PIERCE]: new PierceHoverStrategy(),
      [SelectorType.TEXT]: new TextHoverStrategy(),
      [SelectorType.ARIA]: new AriaHoverStrategy(),
    };
  }

  async performOperation(page: Page, operation: any) {
    if (!operation || !operation.steps) return;
    const randomDelay = 3000 + Math.floor(Math.random() * 2000);

    // eeListClick, select_product, select_promotion, eePromoClick
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      if (
        request.url().includes('eeListClick') ||
        request.url().includes('select_promotion') ||
        request.url().includes('eePromoClick')
      ) {
        Logger.log('request.url(): ', request.url());
        // small delay will cause the dataLayer to be different
        // it's unknown why, but instead of using webMonitoringService.updateSelfDataLayer
        // we use updateSelfDataLayerAlgorithm to update the dataLayer manually
        const latestDataLayer = await page.evaluate(() => {
          return window.dataLayer;
        });
        // console.log('latestDataLayer: ', latestDataLayer);
        this.webMonitoringService.updateSelfDataLayerAlgorithm(
          latestDataLayer,
          operation.title
        );
      }
      await request.continue();
    });

    for (const step of operation.steps) {
      switch (step.type) {
        case BrowserAction.SETVIEWPORT:
          await this.handleSetViewport(page, step);
          break;

        case BrowserAction.NAVIGATE:
          await this.handleNavigate(page, step);
          break;

        case BrowserAction.CLICK:
          // click too fast will be identified as bot, _s=number at the end of the url
          await new Promise((resolve) => setTimeout(resolve, randomDelay));
          await this.handleClick(page, step);
          await this.webMonitoringService.updateSelfDataLayer(
            page,
            operation.title
          );
          break;

        case BrowserAction.CHANGE:
          await new Promise((resolve) => setTimeout(resolve, randomDelay));
          await this.handleChange(page, step);
          await this.webMonitoringService.updateSelfDataLayer(
            page,
            operation.title
          );
          break;

        case BrowserAction.HOVER:
          await new Promise((resolve) => setTimeout(resolve, randomDelay));
          await this.handleHover(page, step);
          break;

        // Add more cases for other browser actions if needed
        default:
          Logger.warn(`Unknown action type: ${step.type}`);
      }
    }

    Logger.log('performOperation completes');
  }

  async handleSetViewport(page: Page, step: any) {
    await page.setViewport({
      width: step.width + (1920 - step.width),
      height: step.height + (1080 - step.height),
    });
  }

  async handleNavigate(page: Page, step: any) {
    await page.goto(step.url, { waitUntil: 'networkidle2' });
    await page.reload({
      waitUntil: 'networkidle2',
    });
  }

  async handleClick(page: Page, step: any): Promise<void> {
    Logger.log('click');
    let clickedSuccessfully = false;

    for (const selectorGroup of step.selectors) {
      // TODO: Scroll into view if needed
      // try {
      //   await this.utilitiesService.scrollIntoViewIfNeeded(
      //     Array.isArray(selectorGroup) ? selectorGroup[0] : [selectorGroup],
      //     page,
      //     20000
      //   );
      // } catch (error) {
      //   console.error('scrollIntoViewIfNeeded error: ', error);
      // }

      if (
        await this.clickElement(
          page,
          Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup
        )
      ) {
        clickedSuccessfully = true;
        Logger.log(
          'click success! ',
          Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup
        );
        break; // Exit the loop as soon as one selector works
      }
    }

    if (!clickedSuccessfully) {
      throw new HttpException(
        `Failed to click. None of the selectors worked for action ${step.target}`,
        500
      );
    }
  }

  async handleChange(page: Page, step: any, timeout = 1000) {
    const selectors = step.selectors;
    const value = step.value;

    for (const selectorArray of selectors) {
      try {
        return await this.changeElement(page, selectorArray[0], value, timeout);
      } catch (error) {
        throw new HttpException(
          `Failed to change value with selector ${selectorArray[0]}. Reason: ${error.message}`,
          500
        );
      }
    }
    return false;
  }

  async handleHover(page: Page, step: any) {
    Logger.log('handleHover');
    const selectors = step.selectors;
    let hoveredSuccessfully = false;

    for (const selectorArray of selectors) {
      try {
        if (
          await this.hoverElement(
            page,
            Array.isArray(selectorArray) ? selectorArray[0] : selectorArray
          )
        ) {
          hoveredSuccessfully = true;
          Logger.log(
            'hover success! ',
            Array.isArray(selectorArray) ? selectorArray[0] : selectorArray
          );
          break; // Exit the loop as soon as one selector works
        }
      } catch (error) {
        Logger.error('hoverElement error ', error);
      }
    }

    if (!hoveredSuccessfully) {
      throw new HttpException(
        `Failed to hover. None of the selectors worked for action ${step.target}`,
        500
      );
    }
  }

  // ----------------------------------------------
  // Click strategies
  // ----------------------------------------------

  async clickElement(page: Page, selector: string, timeout = 1000) {
    const type = getSelectorType(selector); // Implement this function to get the type (CSS, XPath, etc.) from the selector
    const strategy = this.clickStrategies[type];

    if (!strategy) {
      Logger.error(`No strategy found for selector type ${type}`);
      return false;
    }
    Logger.log('clickElement: ', selector);
    return await strategy.clickElement(page, selector, timeout);
  }

  // ----------------------------------------------
  // Change strategies
  // ----------------------------------------------

  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout = 1000
  ) {
    const type = getSelectorType(selector);
    const strategy = this.changeStrategies[type];

    if (!strategy) {
      Logger.error(`No strategy found for selector type ${type}`);
      return false;
    }

    return await strategy.changeElement(page, selector, value, timeout);
  }

  // ----------------------------------------------
  // Hover strategies
  // ----------------------------------------------

  async hoverElement(page: Page, selector: string, timeout = 1000) {
    const type = getSelectorType(selector); // Implement this function to get the type (CSS, XPath, etc.) from the selector
    const strategy = this.hoverStrategies[type];

    if (!strategy) {
      Logger.error(`No strategy found for selector type ${type}`);
      return false;
    }

    return await strategy.hoverElement(page, selector, timeout);
  }
}
