import { Injectable, Logger } from '@nestjs/common';
import type { QueryRoot } from '../../handlers/frame';
import { PageClickService } from './page-click.service';
import { EvaluateClickService } from './evaluate-click.service';
import { ClickOperation } from './utils';

/**
 * Clicks an element with one of two methods and falls back to the other:
 * page.click(), a real mouse click at the element's position, or
 * element.click(), a DOM click that reaches elements the mouse cannot.
 */
@Injectable()
export class ClickStrategyService {
  private readonly logger = new Logger(ClickStrategyService.name);
  constructor(
    private readonly pageClickService: PageClickService,
    private readonly evaluateClickService: EvaluateClickService
  ) {}

  /**
   * Starts with page.click() when `useNormalClick` is set, otherwise with
   * element.click(). Resolves true once either method clicked, false when
   * neither did. Never throws.
   */
  async clickElement(
    page: QueryRoot,
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
    const [first, fallback]: ClickOperation[] = useNormalClick
      ? [this.pageClickService, this.evaluateClickService]
      : [this.evaluateClickService, this.pageClickService];
    try {
      return (
        (await first.operate(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          timeout
        )) ||
        (await fallback.operate(
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
        `Failed to click on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
