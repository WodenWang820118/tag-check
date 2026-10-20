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
import { ProjectService } from '../../../../infrastructure/os/project/project.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { FilePathService } from '../../../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../../../infrastructure/os/file/file.service';
import { OperationFile, Step } from '@utils';
import { ActionUtilsService } from '../action-utils/action-utils.service';

@Injectable()
export class ClickHandler implements ActionHandler {
  private readonly logger = new Logger(ClickHandler.name);
  constructor(
    private readonly projectService: ProjectService,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isLastStep: boolean
  ): Promise<void> {
    let clickedSuccessfully = false;
    const preventNavigation = false;
    const offsetX = step.offsetX;
    const offsetY = step.offsetY;
    const candidates = (step.selectors ?? []).map(getFirstSelector);
    const visible = await waitForAnySelector(page, candidates);
    if (!visible) {
      this.logger.warn(
        `None of ${candidates.length} selector(s) became visible within ${STEP_SELECTOR_TIMEOUT_MS} ms: ${candidates.join(', ')}`
      );
      throw new InternalServerErrorException(
        `Failed to click. None of the selectors worked for action ${step.target}`
      );
    }
    for (const firstSelector of preferSelector(candidates, visible)) {
      try {
        // The shared wait above already saw the preferred selector.
        const clicked = await this.clickElement(
          page,
          projectSlug,
          eventId,
          firstSelector,
          { preventNavigation, timeout: 2000, offsetX, offsetY }
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

    if (offsetX !== undefined && offsetY !== undefined) {
      const elementHandle = await page.$(selector);
      if (!elementHandle) {
        throw new InternalServerErrorException(
          `Element not found for selector ${selector}`
        );
      }
      // Offsets are relative to the element, and a mouse click outside the
      // viewport is lost. Scroll first, like the Chrome Recorder replay does.
      await elementHandle.scrollIntoView();
      const box = await elementHandle.boundingBox();
      if (!box) {
        throw new InternalServerErrorException(
          `Could not determine bounding box for selector ${selector}`
        );
      }
      if (preventNavigation) {
        await this.preventNavigationOnElement(page, selector);
      }
      // Perform mouse click at specified offset
      await page.mouse.click(box.x + offsetX, box.y + offsetY, { delay: 100 });
      return true;
    }

    // Determine the click method based on conditions
    const pages = await page.browserContext().pages();
    const useNormalClick = pages.length === 1 || !page.url().includes(domain);

    if (preventNavigation) {
      await this.preventNavigationOnElement(page, selector);
    }

    try {
      const selectorType = this.actionUtilsService.getSelectorType(selector);
      if (!selectorType) {
        throw new HttpException(
          `Selector type not found for selector ${selector}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      const result = await this.clickStrategyService.clickElement(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        useNormalClick,
        timeout
      );
      return result;
    } catch (error) {
      this.logger.error(error);
      throw error; // Re-throw the error to be caught in the calling method
    }
  }

  eventTargetToNode(eventTarget: EventTarget): Node {
    return eventTarget as Node; // Convert EventTarget to Node
  }

  private async preventNavigationOnElement(
    page: Page,
    selector: string
  ): Promise<void> {
    this.logger.log(`Preventing navigation on selector: ${selector}`);

    await page.evaluate((sel) => {
      const isDescendant = (parent: Node, child: Node | null): boolean => {
        let node = child;
        while (node !== null) {
          if (node === parent) {
            return true;
          }
          node = node.parentNode;
        }
        return false;
      };

      const elements = document.querySelectorAll<HTMLElement>(sel);
      for (const elem of elements) {
        elem.addEventListener('click', (e) => {
          const target = e.target as Node;
          // Check if the target is the element itself or a descendant of the element
          if (target === elem || isDescendant(elem, target)) {
            e.preventDefault();
          }
        });
      }
    }, selector);
  }
}
