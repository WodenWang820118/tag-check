import { Injectable, Logger } from '@nestjs/common';
import { EvaluateChangeService } from './evaluate-change.service';
import { PageChangeService } from './page-change.service';
import { ChangeStrategy } from './utils';
import { Page } from 'puppeteer';

@Injectable()
export class ChangeStrategyService implements ChangeStrategy {
  constructor(
    private pageChangeService: PageChangeService,
    private evaluateChangeService: EvaluateChangeService
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
        Logger.error(
          'Value is required to change the element',
          `${ChangeStrategyService.name}.${ChangeStrategyService.prototype.changeElement.name}`
        );
        return false;
      }

      return await this.attemptChange(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        value,
        this.pageChangeService.operate,
        timeout
      );
    } catch (error) {
      Logger.error(
        error,
        `${ChangeStrategyService.name}.${ChangeStrategyService.prototype.changeElement.name}`
      );
      return false;
    }
  }

  async attemptChange(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value: string,
    changeMethod: (
      page: Page,
      projectName: string,
      eventId: string,
      selector: string,
      selectorType: string,
      value?: string,
      timeout?: number
    ) => Promise<boolean>,
    timeout = 10000
  ): Promise<boolean> {
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
      // Fallback to the other click method
      const fallbackMethod =
        serviceInstance === this.pageChangeService
          ? this.evaluateChangeService.operate
          : this.pageChangeService.operate;

      return await fallbackMethod.call(
        serviceInstance === this.pageChangeService
          ? this.evaluateChangeService
          : this.pageChangeService,
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
