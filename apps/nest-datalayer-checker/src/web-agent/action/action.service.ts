import { Injectable } from '@nestjs/common';
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

enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
  CHANGE = 'change',
  KEYDOWN = 'keyDown',
  KEYUP = 'keyUp',
}

@Injectable()
export class ActionService {
  private clickStrategies: { [key: string]: ClickStrategy };
  private changeStrategies: { [key: string]: ChangeStrategy };

  constructor(private utilitiesService: UtilitiesService) {
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
  }

  async performOperation(page: Page, operation: any) {
    if (!operation || !operation.steps) return;

    const randomDelay = 3000 + Math.floor(Math.random() * 2000);

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
          break;

        case BrowserAction.CHANGE:
          await new Promise((resolve) => setTimeout(resolve, randomDelay));
          await this.handleChange(page, step);
          break;

        // Add more cases for other browser actions if needed
        default:
          console.warn(`Unknown action type: ${step.type}`);
      }
    }

    console.log('performOperation completes');
  }

  async handleSetViewport(page: Page, step: any) {
    await page.setViewport({
      width: step.width + (1920 - step.width),
      height: step.height + (1080 - step.height),
    });
  }

  async handleNavigate(page: Page, step: any) {
    await page.goto(step.url);
    // await page.reload({
    //   waitUntil: 'networkidle2',
    // });
  }

  async handleClick(page: Page, step: any): Promise<void> {
    console.log('click');
    let clickedSuccessfully = false;

    for (const selectorGroup of step.selectors) {
      try {
        await this.utilitiesService.scrollIntoViewIfNeeded(
          selectorGroup,
          page,
          30000
        );
      } catch (error) {
        console.error('scrollIntoViewIfNeeded error: ', error);
      }

      if (await this.clickElement(page, selectorGroup[0])) {
        clickedSuccessfully = true;
        break; // Exit the loop as soon as one selector works
      }
    }

    if (!clickedSuccessfully) {
      throw new Error(
        `Failed to click. None of the selectors worked for action ${step.target}`
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
        console.error(
          `Failed to change value with selector ${selectorArray[0]}. Reason: ${error.message}`
        );
      }
    }
    return false;
  }

  // ----------------------------------------------
  // Click strategies
  // ----------------------------------------------

  async clickElement(page: Page, selector: string, timeout = 1000) {
    const type = getSelectorType(selector); // Implement this function to get the type (CSS, XPath, etc.) from the selector
    const strategy = this.clickStrategies[type];

    if (!strategy) {
      console.error(`No strategy found for selector type ${type}`);
      return false;
    }

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
      console.error(`No strategy found for selector type ${type}`);
      return false;
    }

    return await strategy.changeElement(page, selector, value, timeout);
  }
}
