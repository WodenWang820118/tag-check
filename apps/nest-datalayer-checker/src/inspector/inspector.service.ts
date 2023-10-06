import { HttpException, Injectable, Logger } from '@nestjs/common';
import { WebAgentService } from '../web-agent/web-agent.service';
import { SharedService } from '../shared/shared.service';
import { FilePathOptions } from '../shared/interfaces/file-path-options.interface';
import {
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
  ValidationStrategy,
} from './strategy/dataLayer-validation-strategy';
import { ValidationStrategyType, determineStrategy } from './utilities';
import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
} from '../shared/interfaces/data-layer.interface';
import { RequestProcessorService } from './request-processor/request-processor.service';
import { Browser, Credentials, Page } from 'puppeteer';
import { writeFileSync } from 'fs';
import path from 'path';

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
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 1. Get the project spec from the local file system
    const specOption: FilePathOptions = {
      name: projectName,
      absolutePath: path,
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
          path,
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
            path,
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
      const operationBatch = operations.slice(i, i + concurrency);

      const batchPromises = operationBatch.map(async (operation) => {
        const cachePath = path.join(
          this.sharedService.getReportSavingFolder(projectName),
          operation.replace('.json', ''),
          `${operation.replace('.json', '')} - result cache.json`
        );
        try {
          const page = await browser.newPage();
          const result = await this.inspectDataLayer(
            page,
            projectName,
            operation.replace('.json', ''),
            filePath,
            measurementId,
            credentials
          );
          writeFileSync(cachePath, JSON.stringify(result, null, 2));
          return result;
        } catch (error) {
          Logger.warn(error, 'error');
          writeFileSync(cachePath, JSON.stringify(error, null, 2));
          return { error: error.message };
        }
      });
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
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
      throw new HttpException('An error occurred', 500);
    }
  }
}
