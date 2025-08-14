import { Injectable, Logger } from '@nestjs/common';
import { EvaluateChangeService } from './evaluate-change.service';
import { PageChangeService } from './page-change.service';
import { ChangeStrategy, ChangeOperation } from './utils';
import { Page } from 'puppeteer';

// Context for change operations to reduce parameter list
interface ChangeContext {
  page: Page;
  projectName: string;
  eventId: string;
  selector: string;
  selectorType: string;
  value: string;
}
@Injectable()
export class ChangeStrategyService implements ChangeStrategy {
  private readonly logger = new Logger(ChangeStrategyService.name);
  constructor(
    private readonly pageChangeService: PageChangeService,
    private readonly evaluateChangeService: EvaluateChangeService
  ) {}

  async changeElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 10000
  ): Promise<boolean> {
    try {
      if (!value) {
        this.logger.error('Value is required to change the element');
        return false;
      }

      return await this.attemptChange(
        { page, projectName, eventId, selector, selectorType, value },
        this.pageChangeService.operate,
        timeout
      );
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector "${selector}": ${error}`
      );
      return false;
    }
  }

  async attemptChange(
    ctx: ChangeContext,
    changeMethod: ChangeOperation['operate'],
    timeout = 10000
  ): Promise<boolean> {
    const { page, projectName, eventId, selector, selectorType, value } = ctx;
    const serviceInstance =
      changeMethod === this.pageChangeService.operate
        ? this.pageChangeService
        : this.evaluateChangeService;

    const result = await changeMethod.call(
      serviceInstance,
      page,
      projectName,
      eventId,
      selector,
      selectorType,
      value,
      timeout
    );

    if (!result) {
      // Fallback to the other change method
      const fallbackMethod =
        serviceInstance === this.pageChangeService
          ? this.evaluateChangeService.operate
          : this.pageChangeService.operate;
      const fallbackInstance =
        serviceInstance === this.pageChangeService
          ? this.evaluateChangeService
          : this.pageChangeService;
      return await fallbackMethod.call(
        fallbackInstance,
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        value,
        timeout
      );
    }
    return result;
  }
}
