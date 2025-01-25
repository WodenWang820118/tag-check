import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { StrictDataLayerEvent, ValidationStrategy } from '@utils';
import { STRATEGY_TYPE, ValidationStrategyType } from './utils';

@Injectable()
export class InspectorUtilsService {
  private readonly logger = new Logger(InspectorUtilsService.name);
  constructor(
    @Inject(STRATEGY_TYPE)
    private strategy: { [key: string]: ValidationStrategy }
  ) {}

  // return true if the dataLayer is correct
  // return missing keys if the dataLayer is partially correct
  // return false if the dataLayer object hasn't been found
  isDataLayerCorrect(
    dataLayer: StrictDataLayerEvent[],
    spec: StrictDataLayerEvent
  ) {
    const strategyType = this.determineStrategy();

    try {
      switch (strategyType) {
        case ValidationStrategyType.ECOMMERCE:
        case ValidationStrategyType.OLDGA4EVENTS:
          return this.strategy[strategyType].validateDataLayer(dataLayer, spec);
        default:
          return {
            passed: false,
            message: "The test didn't pass",
            dataLayerSpec: spec,
          };
      }
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  determineStrategy() {
    try {
      if (this.isNumericKeysObject([ValidationStrategyType.ECOMMERCE])) {
        return ValidationStrategyType.ECOMMERCE;
      } else {
        return ValidationStrategyType.OLDGA4EVENTS;
      }
    } catch (error) {
      const errorMessage = `There is no spec available for determining strategy.`;
      this.logger.log(errorMessage);
      throw new InternalServerErrorException(errorMessage);
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
