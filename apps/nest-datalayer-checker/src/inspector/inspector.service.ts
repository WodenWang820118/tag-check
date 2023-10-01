import { Injectable } from '@nestjs/common';
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
import { Credentials } from 'puppeteer';

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
    projectName: string,
    testName: string,
    headless: string,
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
          projectName,
          testName,
          [''],
          headless,
          path
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
            projectName,
            testName,
            [''],
            headless,
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
          rawRequest,
          requestCheckResult,
          destinationUrl,
        };
      }
    }
  }

  async inspectProjectDataLayer(
    projectName: string,
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    const operations = this.sharedService.getOperationJsonByProject({
      name: projectName,
    });
    const results = [];
    for (const operation of operations) {
      try {
        const result = await this.inspectDataLayer(
          projectName,
          operation.replace('.json', ''),
          headless,
          path,
          measurementId,
          credentials
        );
        results.push(result);
      } catch (error) {
        results.push({
          passed: false,
          message: 'There is no corresponding test recording',
          dataLayerSpec: operation,
        });
      }
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
      console.error('An error occurred:', error);
      return false;
    }
  }
}
