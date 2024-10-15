/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ChangeOperation } from './utils';
import { ActionUtilsService } from '../../action-utils/action-utils.service';

@Injectable()
export class EvaluateChangeService implements ChangeOperation {
  private readonly logger = new Logger(EvaluateChangeService.name);
  constructor(private actionUtilsService: ActionUtilsService) {}
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 5000
  ): Promise<boolean> {
    // TODO: verifiy this
    if (!value) {
      this.logger.error('Value is required to change the element');
      return false;
    }

    try {
      const element = await this.actionUtilsService.getElement(
        page,
        selectorType,
        selector
      );

      if (!element) {
        this.logger.error(
          `Failed to change element with selector "${selector}": Element not found`
        );
        return false;
      }
      const tagName = await element.evaluate((el) => el.tagName.toLowerCase());

      await Promise.race([
        (async () => {
          if (tagName === 'select') {
            await element.select(value);
          } else if (tagName === 'input' || tagName === 'textarea') {
            await element.type(value);
          } else {
            throw new Error(`Unsupported element type: ${tagName}`);
          }
        })(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout exceeded Changing')),
            timeout
          )
        ),
      ]);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
