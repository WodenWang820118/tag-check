import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
} from './strategy/dataLayer-validation-strategy';
import { ValidationStrategyType, determineStrategy } from './utilities';
import {
  StrictDataLayerEvent,
  ValidationStrategy,
} from '../interfaces/dataLayer.interface';
import { Browser, Credentials } from 'puppeteer';
import { FileService } from '../os/file/file.service';
import { FilePathService } from '../os/path/file-path/file-path.service';
import { InspectorSingleEventService } from './inspector-single-event.service';

@Injectable()
export class InspectorGroupEventsService {
  private validationStrategies: { [key: string]: ValidationStrategy };

  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private inspectorSingleEventService: InspectorSingleEventService
  ) {
    this.validationStrategies = {
      [ValidationStrategyType.ECOMMERCE]:
        new EcommerceEventValidationStrategy(),
      [ValidationStrategyType.OLDGA4EVENTS]:
        new OldGA4EventsValidationStrategy(),
    };
  }

  async inspectProjectDataLayer(
    browser: Browser,
    projectName: string,
    filePath?: string,
    headless?: string,
    measurementId?: string,
    credentials?: Credentials,
    concurrency?: number
  ) {
    // deal with invalid concurrency
    concurrency = Math.max(1, concurrency || 1);

    const operations = await this.fileService.getOperationJsonByProject(
      projectName
    );

    const results = [];
    for (let i = 0; i < operations.length; i += concurrency) {
      const incognitoContext = await browser.createBrowserContext();
      const operationBatch = operations.slice(i, i + concurrency);

      const batchPromises = operationBatch.map(async (operation) => {
        const testName = operation.replace('.json', '');
        try {
          const page = await incognitoContext.newPage();
          const result =
            await this.inspectorSingleEventService.inspectDataLayer(
              page,
              projectName,
              testName,
              filePath,
              headless,
              measurementId,
              credentials
            );
          await this.fileService.writeCacheFile(projectName, operation, result);
          const imageSavingFolder = await this.filePathService.getImageFilePath(
            projectName,
            testName
          );

          await page.screenshot({
            path: imageSavingFolder,
          });
          await page.close();
          return result;
        } catch (error) {
          Logger.error(error.message, 'inspector.inspectProjectDataLayer');
          await this.fileService.writeCacheFile(
            projectName,
            operation,
            error.message
          );
          await incognitoContext.close();
          return { error: error.message };
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
    const strategyType = determineStrategy(spec);

    try {
      switch (strategyType) {
        case ValidationStrategyType.ECOMMERCE:
          return this.validationStrategies[strategyType].validateDataLayer(
            dataLayer,
            spec
          );
        case ValidationStrategyType.OLDGA4EVENTS:
          return this.validationStrategies[strategyType].validateDataLayer(
            dataLayer,
            spec
          );
        default:
          return {
            passed: false,
            message: "The test didn't pass",
            dataLayerSpec: spec,
          };
      }
    } catch (error) {
      throw new HttpException(`${error.message}`, 500);
    }
  }
}
