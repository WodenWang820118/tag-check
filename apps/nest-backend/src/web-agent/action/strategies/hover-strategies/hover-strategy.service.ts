/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PageHoverService } from './page-hover.service';
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { EvaluateHoverService } from './evaluate-hover.service';

@Injectable()
export class HoverStrategyService {
  private readonly logger = new Logger(HoverStrategyService.name);
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
      this.logger.error(
        `Failed to hover on element with selector "${selector}": ${error}`
      );
      return false;
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
    this.logger.log(`selector: ${selector}`);

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
