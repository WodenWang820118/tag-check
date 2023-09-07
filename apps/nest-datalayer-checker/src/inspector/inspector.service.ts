import { Injectable } from '@nestjs/common';
import { WebAgentService } from '../web-agent/web-agent.service';
import { SharedService } from '../shared-module/shared-service.service';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import {
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
  ValidationStrategy,
  ValidationStrategyType,
} from './dataLayerValidationStrategy';
import { DataLayerEvent } from '../interfaces/dataLayer.interface';

@Injectable()
export class InspectorService {
  private validationStrategies: { [key: string]: ValidationStrategy };

  constructor(
    private webAgentService: WebAgentService,
    private sharedService: SharedService
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
    path?: string
  ) {
    // 1. Get the project spec from the local file system
    const specOption: FilePathOptions = {
      name: projectName,
      absolutePath: path,
    };

    const specs = this.sharedService.getSpecJsonByProject(specOption);

    // expectedObj is the spec to be compared with the result
    const expectedObj = specs.find(
      (spec: DataLayerEvent) => spec.event === testName
    );

    // 2. Execute the recording script and get the result
    const result = await this.webAgentService.executeAndGetDataLayer(
      projectName,
      testName,
      '',
      headless
    );

    // 3. Compare the result with the project spec
    // 3.1 Get the corresponding event object from the result
    // 3.2 Compare the expectedObj with the result, applying strategies
    return this.isDataLayerCorrect(result, expectedObj);
  }

  // return true if the dataLayer is correct
  // return missing keys if the dataLayer is partially correct
  // return false if the dataLayer object hasn't been found
  isDataLayerCorrect(dataLayer: DataLayerEvent[], spec: DataLayerEvent) {
    const strategyType = this.determineStrategy(spec);

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

  determineStrategy(spec: DataLayerEvent) {
    if (spec.event[ValidationStrategyType.ECOMMERCE]) {
      return ValidationStrategyType.ECOMMERCE;
    } else {
      return ValidationStrategyType.OLDGA4EVENTS;
    }
  }
}
