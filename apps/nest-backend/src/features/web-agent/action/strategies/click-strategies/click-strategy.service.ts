import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { PageClickService } from './page-click.service';
import { EvaluateClickService } from './evaluate-click.service';

@Injectable()
export class ClickStrategyService {
  private readonly logger = new Logger(ClickStrategyService.name);
  constructor(
    private readonly pageClickService: PageClickService,
    private readonly evaluateClickService: EvaluateClickService
  ) {}

  async clickElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    useNormalClick: boolean,
    timeout = 10000
  ): Promise<boolean> {
    this.logger.log(
      `Attempting to click on element with selector "${selector}" using ${
        useNormalClick ? 'page.click()' : 'element.click()'
      }`
    );
    try {
      if (useNormalClick) {
        return await this.attemptClick(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          this.pageClickService.operate,
          timeout
        );
      } else {
        return await this.attemptClick(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          this.evaluateClickService.operate,
          timeout
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to click on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }

  async attemptClick(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    clickMethod: (
      page: Page,
      projectName: string,
      eventId: string,
      selector: string,
      selectorType: string,
      timeout: number
    ) => Promise<boolean>,
    timeout = 10000
  ): Promise<boolean> {
    const serviceInstance =
      clickMethod === this.pageClickService.operate
        ? this.pageClickService
        : this.evaluateClickService;

    const result = await clickMethod.call(
      serviceInstance,
      page,
      projectName,
      eventId,
      selector,
      selectorType,
      timeout
    );

    if (!result) {
      // Fallback to the other click method
      const fallbackMethod =
        serviceInstance === this.pageClickService
          ? this.evaluateClickService.operate
          : this.pageClickService.operate;

      return await fallbackMethod.call(
        serviceInstance === this.pageClickService
          ? this.evaluateClickService
          : this.pageClickService,
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        timeout
      );
    }
    return result;
  }
}
