import { HttpException, Injectable, Logger } from '@nestjs/common';
import { WebAgentService } from '../web-agent/web-agent.service';
import { SharedService } from '../shared/shared.service';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import {
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
  ValidationStrategy,
} from './strategy/dataLayer-validation-strategy';
import { ValidationStrategyType, determineStrategy } from './utilities';
import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
} from '../interfaces/dataLayer.interface';
import { RequestProcessorService } from './request-processor/request-processor.service';
import { Browser, Credentials, Page } from 'puppeteer';

@Injectable()
export class InspectorService {
  private validationStrategies: { [key: string]: ValidationStrategy };

  constructor(
    private webAgentService: WebAgentService,
    private sharedService: SharedService,
    private requestProcessorService: RequestProcessorService
  ) {
    this.validationStrategies = {
      [ValidationStrategyType.ECOMMERCE]:
        new EcommerceEventValidationStrategy(),
      [ValidationStrategyType.OLDGA4EVENTS]:
        new OldGA4EventsValidationStrategy(),
    };
  }

  // inspect one event
  async inspectDataLayer(
    page: Page,
    projectName: string,
    testName: string,
    headless: string,
    filePath?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 1. Get the project spec from the local file system
    const specOption: FilePathOptions = {
      name: projectName,
      absolutePath: filePath,
    };
    const specs = this.sharedService.getSpecJsonByProject(specOption);

    // expectedObj is the spec to be compared with the result
    const expectedObj = specs.find(
      (spec: BaseDataLayerEvent) => spec.event === testName
    );

    // 2. Execute the recording script and get the result
    // switch the measurementId to determine whether to grab requests

    switch (measurementId) {
      case undefined: {
        const result = await this.webAgentService.executeAndGetDataLayer(
          page,
          projectName,
          testName,
          filePath,
          credentials
        );

        // 3. Compare the result with the project spec
        // 3.1 Get the corresponding event object from the result
        // 3.2 Compare the expectedObj with the result, applying strategies
        const dataLayerCheckResult = this.isDataLayerCorrect(
          result.dataLayer,
          expectedObj
        );

        const destinationUrl = result.destinationUrl;
        await this.sharedService.writeCacheFile(projectName, testName, result);
        await this.sharedService.screenshot(page, projectName, testName);

        if (headless === 'new') await page.close();

        return {
          dataLayerCheckResult,
          destinationUrl,
        };
      }
      default: {
        const result =
          await this.webAgentService.executeAndGetDataLayerAndRequest(
            page,
            projectName,
            testName,
            filePath,
            measurementId,
            credentials
          );

        // 3. Compare the result with the project spec
        // 3.1 Get the corresponding event object from the result
        // 3.2 Compare the expectedObj with the result, applying strategies
        const dataLayerCheckResult = this.isDataLayerCorrect(
          result.dataLayer,
          expectedObj
        );

        const rawRequest = result.eventRequest;

        const recomposedRequest =
          this.requestProcessorService.recomposeGA4ECEvent(result.eventRequest);

        const requestCheckResult = this.isDataLayerCorrect(
          [recomposedRequest],
          expectedObj
        );

        const destinationUrl = result.destinationUrl;
        await this.sharedService.writeCacheFile(projectName, testName, result);
        await this.sharedService.screenshot(page, projectName, testName);
        await page.close();

        return {
          dataLayerCheckResult,
          destinationUrl,
          rawRequest,
          requestCheckResult,
        };
      }
    }
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

    const operations = this.sharedService.getOperationJsonByProject({
      name: projectName,
    });

    const results = [];
    for (let i = 0; i < operations.length; i += concurrency) {
      const incognitoContext = await browser.createIncognitoBrowserContext();
      const operationBatch = operations.slice(i, i + concurrency);

      const batchPromises = operationBatch.map(async (operation) => {
        const testName = operation.replace('.json', '');
        try {
          const page = await incognitoContext.newPage();
          const result = await this.inspectDataLayer(
            page,
            projectName,
            testName,
            filePath,
            headless,
            measurementId,
            credentials
          );
          await this.sharedService.writeCacheFile(
            projectName,
            operation,
            result
          );
          await this.sharedService.screenshot(page, projectName, testName);
          await page.close();
          return result;
        } catch (error) {
          Logger.error(error.message, 'inspector.inspectProjectDataLayer');
          await this.sharedService.writeCacheFile(
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
          return false;
      }
    } catch (error) {
      throw new HttpException(`${error.message}`, 500);
    }
  }
}
