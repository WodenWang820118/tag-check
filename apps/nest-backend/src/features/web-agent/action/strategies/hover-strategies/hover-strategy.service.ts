import { PageHoverService } from './page-hover.service';
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { EvaluateHoverService } from './evaluate-hover.service';

/**
 * Hovers an element with page.hover() and falls back to an element handle,
 * which also resolves XPath, text, ARIA and pierce selectors.
 */
@Injectable()
export class HoverStrategyService {
  private readonly logger = new Logger(HoverStrategyService.name);
  constructor(
    private readonly pageHoverService: PageHoverService,
    private readonly evaluateHoverService: EvaluateHoverService
  ) {}

  /**
   * Resolves true once either method hovered the element, false when
   * neither did. Never throws.
   */
  async hoverElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    timeout = 10000
  ): Promise<boolean> {
    this.logger.log(`selector: ${selector}`);
    try {
      return (
        (await this.pageHoverService.operate(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          timeout
        )) ||
        (await this.evaluateHoverService.operate(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          timeout
        ))
      );
    } catch (error) {
      this.logger.error(
        `Failed to hover on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
