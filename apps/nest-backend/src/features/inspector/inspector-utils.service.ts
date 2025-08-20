import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  StrictDataLayerEvent,
  ValidationResult,
  ValidationStrategy
} from '@utils';
import { STRATEGY_TYPE, ValidationStrategyType } from './utils';

@Injectable()
export class InspectorUtilsService {
  private readonly logger = new Logger(InspectorUtilsService.name);
  constructor(
    @Inject(STRATEGY_TYPE)
    private readonly strategy: { [key: string]: ValidationStrategy }
  ) {}

  // return true if the dataLayer is correct
  // return missing keys if the dataLayer is partially correct
  // return false if the dataLayer object hasn't been found
  isDataLayerCorrect(
    dataLayer: StrictDataLayerEvent[],
    spec: StrictDataLayerEvent
  ) {
    const strategyType = this.determineStrategy();
    this.logger.debug(`Using validation strategy: ${strategyType}`);
    try {
      switch (strategyType) {
        case ValidationStrategyType.ECOMMERCE:
        case ValidationStrategyType.NONEC:
          return this.strategy[strategyType].validateDataLayer(dataLayer, spec);
        default: {
          const result: ValidationResult = {
            passed: false,
            message: 'Unmatched data layer',
            eventName: spec.event,
            dataLayer: dataLayer,
            dataLayerSpec: spec
          };
          return result;
        }
      }
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  determineStrategy() {
    if (this.isNumericKeysObject([ValidationStrategyType.ECOMMERCE])) {
      return ValidationStrategyType.ECOMMERCE;
    } else {
      return ValidationStrategyType.NONEC;
    }
  }

  isNumericKeysObject(obj: unknown): obj is Record<number, unknown> {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      Object.keys(obj).every(Number.isInteger)
    );
  }
}
