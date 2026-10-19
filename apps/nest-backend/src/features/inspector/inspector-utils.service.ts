import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  StrictDataLayerEvent,
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
    const strategyType = this.determineStrategy(spec);
    this.logger.debug(`Using validation strategy: ${strategyType}`);
    return this.validate(strategyType, dataLayer, spec);
  }

  /**
   * Validates the event rebuilt from a GA4 request. The `{ ecommerce: null }`
   * reset only exists in the data layer, so requests skip that rule.
   */
  isRequestCorrect(request: StrictDataLayerEvent, spec: StrictDataLayerEvent) {
    return this.validate(ValidationStrategyType.NONEC, [request], spec);
  }

  /**
   * Ecommerce rules apply to Google's recommended ecommerce events
   * (https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
   * and to any event whose spec carries ecommerce items.
   */
  determineStrategy(spec: StrictDataLayerEvent): ValidationStrategyType {
    const isRecommendedEcommerceEvent = Object.hasOwn(
      GA4_ECOMMERCE_EVENT_PARAMETERS,
      spec.event
    );
    const hasEcommerceItems = Array.isArray(spec.ecommerce?.items);
    return isRecommendedEcommerceEvent || hasEcommerceItems
      ? ValidationStrategyType.ECOMMERCE
      : ValidationStrategyType.NONEC;
  }

  private validate(
    strategyType: ValidationStrategyType,
    dataLayer: StrictDataLayerEvent[],
    spec: StrictDataLayerEvent
  ) {
    try {
      return this.strategy[strategyType].validateDataLayer(dataLayer, spec);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
