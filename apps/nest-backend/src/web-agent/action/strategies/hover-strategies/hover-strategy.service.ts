import { PageHoverService } from './page-hover.service';
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { EvaluateHoverService } from './evaluate-hover.service';

@Injectable()
export class HoverStrategyService {
  constructor(
    private pageHoverService: PageHoverService,
    private evaluteHoverService: EvaluateHoverService
  ) {}

  async hoverElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    timeout = 10000
  ): Promise<boolean> {
    try {
      return await this.attemptHover(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        this.pageHoverService.operate,
        timeout
      );
    } catch (error) {
      Logger.log(
        `Failed to hover element with selector: ${selector}`,
        'HoverStrategyService'
      );
    }
  }

  async attemptHover(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    hoverMethod: (
      page: Page,
      projectName: string,
      eventId: string,
      selector: string,
      selectorType: string,
      timeout: number
    ) => Promise<boolean>,
    timeout = 10000
  ): Promise<boolean> {
    Logger.log(`selector: ${selector}`, 'HoverStrategyService.attemptHover');

    const serviceInstance =
      hoverMethod === this.pageHoverService.operate
        ? this.pageHoverService
        : this.evaluteHoverService;

    const result = await hoverMethod.call(
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
        serviceInstance === this.pageHoverService
          ? this.evaluteHoverService.operate
          : this.pageHoverService.operate;

      return await fallbackMethod.call(
        serviceInstance === this.pageHoverService
          ? this.evaluteHoverService
          : this.pageHoverService,
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
