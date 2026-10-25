import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException
} from '@nestjs/common';
import { Page } from 'puppeteer';
import {
  ActionHandler,
  getFirstSelector,
  preferSelector,
  STEP_SELECTOR_TIMEOUT_MS,
  waitForAnySelector
} from './utils';
import { TestEventRepositoryService } from '../../../../core/repository/test-event/test-event-repository.service';
import { randomUUID } from 'node:crypto';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { FilePathService } from '../../../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../../../infrastructure/os/file/file.service';
import { OperationFile, Step } from '@utils';
import { ActionUtilsService } from '../action-utils/action-utils.service';

/**
 * Replays a click step. Waits for any of the step's selectors to become
 * visible, then clicks with the first that works. When the test sets
 * stopNavigation, the recording's last click has its default action
 * prevented, so it fires the site's listeners without leaving the page.
 */
@Injectable()
export class ClickHandler implements ActionHandler {
  private readonly logger = new Logger(ClickHandler.name);
  constructor(
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService,
    private readonly clickStrategyService: ClickStrategyService,
    private readonly actionUtilsService: ActionUtilsService
  ) {}

  async handle(
    page: Page,
    projectSlug: string,
    eventId: string,
    step: Step,
    isLastClick: boolean
  ): Promise<void> {
    let clickedSuccessfully = false;
    const preventNavigation =
      isLastClick &&
      (
        await this.testEventRepositoryService.getEntityBySlugAndEventId(
          projectSlug,
          eventId
        )
      ).stopNavigation === true;
    const offsetX = step.offsetX;
    const offsetY = step.offsetY;
    const candidates = (step.selectors ?? []).map(getFirstSelector);
    const timeout = step.timeout ?? STEP_SELECTOR_TIMEOUT_MS;
    const visible = await waitForAnySelector(page, candidates, { timeout });
    if (!visible) {
      this.logger.warn(
        `None of ${candidates.length} selector(s) became visible within ${timeout} ms: ${candidates.join(', ')}`
      );
      throw new InternalServerErrorException(
        `Failed to click. None of the selectors became visible within ${timeout} ms for action ${step.target}`
      );
    }
    for (const firstSelector of preferSelector(candidates, visible)) {
      try {
        // The shared wait above already saw the preferred selector; this
        // timeout also bounds the click itself, so keep it at 5 s.
        const clicked = await this.clickElement(
          page,
          projectSlug,
          eventId,
          firstSelector,
          { preventNavigation, timeout: 5000, offsetX, offsetY }
        );
        if (clicked) {
          clickedSuccessfully = true;
          this.logger.log(
            `Clicked successfully using selector: ${firstSelector}`
          );
          break; // Exit the loop as soon as one selector works
        }
      } catch (error) {
        this.logger.warn(
          `Failed to click using selector ${firstSelector}: ${error}`
        );
      }
    }

    if (!clickedSuccessfully) {
      throw new InternalServerErrorException(
        `Failed to click. None of the selectors worked for action ${step.target}`
      );
    }
  }

  private async clickElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    options: {
      preventNavigation: boolean;
      timeout?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): Promise<boolean> {
    const { preventNavigation, timeout = 3000, offsetX, offsetY } = options;
    // Retrieve operation file path and domain
    const operationPath = await this.filePathService.getOperationFilePath(
      projectName,
      eventId
    );
    this.logger.log(`Operation file path: ${operationPath}`);
    const operationFile =
      this.fileService.readJsonFile<OperationFile>(operationPath);
    const stepUrl = operationFile.steps[1]?.url;
    if (!stepUrl) {
      throw new InternalServerErrorException(
        `URL not found in operation file for event ${eventId}`
      );
    }
    const domain = new URL(stepUrl).hostname;

    // Wait for the selector to be visible
    await page.waitForSelector(selector, { timeout, visible: true });

    const cleanupKey = preventNavigation
      ? await this.preventNavigationForClick(page)
      : undefined;

    try {
      // Chrome Recorder stores where inside the element the user clicked;
      // the replay clicks the same point.
      if (offsetX !== undefined && offsetY !== undefined) {
        const elementHandle = await page.$(selector);
        if (!elementHandle) {
          throw new InternalServerErrorException(
            `Element not found for selector ${selector}`
          );
        }
        try {
          await elementHandle.scrollIntoView();
          const box = await elementHandle.boundingBox();
          if (!box) {
            throw new InternalServerErrorException(
              `Could not determine bounding box for selector ${selector}`
            );
          }
          await page.mouse.click(box.x + offsetX, box.y + offsetY, {
            delay: 100
          });
          return true;
        } finally {
          await elementHandle.dispose();
        }
      }

      // Several tabs with the page on the recorded site means a GTM Preview
      // run: start with a DOM click there, and with a mouse click otherwise.
      const pages = await page.browserContext().pages();
      const useNormalClick = pages.length === 1 || !page.url().includes(domain);
      const selectorType = this.actionUtilsService.getSelectorType(selector);
      if (!selectorType) {
        throw new HttpException(
          `Selector type not found for selector ${selector}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      return await this.clickStrategyService.clickElement(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        useNormalClick,
        timeout
      );
    } finally {
      if (cleanupKey) {
        // A scripted redirect can replace the document and its listeners.
        // Cleanup must never hide the original click error.
        await page
          .evaluate(`(() => {
          const key = ${JSON.stringify(cleanupKey)};
          if (typeof window[key] === "function") window[key]();
        })()`)
          .catch((error: unknown) => {
            this.logger.warn(
              `Could not clean up navigation guard: ${String(error)}`
            );
          });
      }
    }
  }

  private async preventNavigationForClick(page: Page): Promise<string> {
    const cleanupKey = `__tagCheckNavigation_${randomUUID()}`;
    // The next click may use CSS, text, aria or XPath selectors.
    // Do not stop propagation: site/GTM listeners must still see the click.
    // A source string avoids missing SWC helpers in the ES5 backend bundle.
    await page.evaluate(`(() => {
      const key = ${JSON.stringify(cleanupKey)};
      const preventDefault = (event) => event.preventDefault();
      document.addEventListener("click", preventDefault, { capture: true, once: true });
      window[key] = () => {
        document.removeEventListener("click", preventDefault, true);
        delete window[key];
      };
    })()`);
    return cleanupKey;
  }
}
