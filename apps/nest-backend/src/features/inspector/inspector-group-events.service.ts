import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import { STRATEGY_TYPE, ValidationStrategyType } from './utils';
import { StrictDataLayerEvent, ValidationStrategy } from '@utils';
import { Page, Browser, Credentials } from 'puppeteer';
import { FileService } from '../../infrastructure/os/file/file.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { InspectorSingleEventService } from './inspector-single-event.service';
import { InspectorUtilsService } from './inspector-utils.service';

@Injectable()
export class InspectorGroupEventsService {
  private readonly logger = new Logger(InspectorGroupEventsService.name);
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService,
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly inspectorUtilsService: InspectorUtilsService,
    @Inject(STRATEGY_TYPE)
    private readonly strategy: { [key: string]: ValidationStrategy }
  ) {}

  async inspectProjectDataLayer(
    browser: Browser,
    projectName: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    concurrency?: number
  ) {
    // deal with invalid concurrency
    concurrency = Math.max(1, concurrency || 1);

    const operations =
      await this.fileService.getOperationJsonByProject(projectName);

    const results: any[] = [];
    for (let i = 0; i < operations.length; i += concurrency) {
      const incognitoContext = await browser.createBrowserContext();
      const operationBatch = operations.slice(i, i + concurrency);

      const batchPromises = operationBatch.map(async (operation) => {
        // TODO: Refactor this to use a eventId instead of a testName
        const testName = operation.replace('.json', '');
        try {
          const page = await incognitoContext.newPage();
          const result =
            await this.inspectorSingleEventService.inspectDataLayer(
              page,
              projectName,
              testName,
              measurementId,
              credentials,
              captureRequest,
              '' as any
            );
          await this.fileService.writeCacheFile(projectName, operation, result);
          const imageSavingFolder = await this.filePathService.getImageFilePath(
            projectName,
            testName
          );

          await page.screenshot({
            fullPage: true,
            path: `${imageSavingFolder}.png`
          });

          const pages = await browser.pages();
          await Promise.all(pages.map((page: Page) => page.close()));
          await browser.close();
          return result;
        } catch (error) {
          this.logger.log(error);
          await this.fileService.writeCacheFile(projectName, operation, error);
          await incognitoContext.close();
          return { error: error };
        }
      });
      // Wait for the batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      // Extract results or errors
      batchResults.forEach((result) => {
        results.push(
          result.status === 'fulfilled' ? result.value : result.reason
        );
      });

      // Dispose of the incognito context after each batch
      await incognitoContext.close();
    }

    return results;
  }

  // return true if the dataLayer is correct
  // return missing keys if the dataLayer is partially correct
  // return false if the dataLayer object hasn't been found
  isDataLayerCorrect(
    dataLayer: StrictDataLayerEvent[],
    spec: StrictDataLayerEvent
  ) {
    const strategyType = this.inspectorUtilsService.determineStrategy();

    try {
      switch (strategyType) {
        case ValidationStrategyType.ECOMMERCE:
        case ValidationStrategyType.OLDGA4EVENTS:
          return this.strategy[strategyType].validateDataLayer(dataLayer, spec);
        default:
          return {
            passed: false,
            message: "The test didn't pass",
            dataLayerSpec: spec
          };
      }
    } catch (error) {
      throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
