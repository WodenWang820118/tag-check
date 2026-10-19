import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationStrategy
} from '@utils';
import { ValidationResultDto } from '../../../shared/dto/validation-result.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

/** Google's GTM ecommerce guide, which asks for `{ ecommerce: null }` before each ecommerce push. */
const ECOMMERCE_RESET_GUIDE =
  'https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm';

@Injectable()
export class EcommerceEventValidationStrategy implements ValidationStrategy {
  private readonly logger = new Logger(EcommerceEventValidationStrategy.name);
  constructor(
    private readonly dataLayerValidationUtilsService: DataLayerValidationUtilsService
  ) {}

  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    let ecommerceReset = false;
    for (const eventObj of dataLayer) {
      if (eventObj.ecommerce === null) {
        ecommerceReset = true;
      }

      if (eventObj.event === dataLayerSpec.event) {
        if (!ecommerceReset) {
          const message = `ecommerce must be reset with { ecommerce: null } before firing ${dataLayerSpec.event} (${ECOMMERCE_RESET_GUIDE}).`;
          this.logger.warn(message);
          return new ValidationResultDto({
            passed: false,
            message,
            dataLayerSpec
          });
        }
        return this.dataLayerValidationUtilsService.validateKeyValues(
          dataLayerSpec,
          eventObj
        );
      }
    }

    return new ValidationResultDto({
      passed: false,
      message: `Event not found: ${dataLayerSpec.event}`,
      dataLayerSpec
    });
  }
}
