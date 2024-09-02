import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { PageClickService } from './page-click.service';
import { EvaluateClickService } from './evaluate-click.service';

@Injectable()
export class ClickStrategyService {
  constructor(
    private pageClickService: PageClickService,
    private evaluateClickService: EvaluateClickService
  ) {}

  async clickElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    useNormalClick: boolean,
    timeout = 10000
  ): Promise<boolean | undefined> {
    Logger.log(
      `selector: ${selector}`,
      `${ClickStrategyService.name}.${ClickStrategyService.prototype.clickElement.name}`
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
      Logger.error(
        error,
        `${ClickStrategyService.name}.${ClickStrategyService.prototype.clickElement.name}`
      );
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
