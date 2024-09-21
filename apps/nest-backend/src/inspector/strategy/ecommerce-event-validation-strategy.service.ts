import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationStrategy,
} from '@utils';
import { ValidationResultDto } from '../../dto/validation-result.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

@Injectable()
export class EcommerceEventValidationStrategy implements ValidationStrategy {
  constructor(
    private dataLayerValidationUtilsService: DataLayerValidationUtilsService
  ) {}

  ecommerceReset = false;

  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    for (const eventObj of dataLayer) {
      // If ecommerce is being set to null, set the flag
      // Check if eventObj contains { ecommerce: null }
      if (eventObj.ecommerce === null) {
        this.ecommerceReset = true;
        Logger.log(this.ecommerceReset, 'ecommerce');
      }

      // If the event is found according to the spec, check the flag
      if (eventObj.event === dataLayerSpec.event) {
        if (!this.ecommerceReset) {
          Logger.warn(
            `ecommerce must be reset before firing ${dataLayerSpec.event}.`,
            `${EcommerceEventValidationStrategy.name}.${EcommerceEventValidationStrategy.prototype.validateDataLayer.name}`
          );
          return new ValidationResultDto(
            false,
            `ecommerce must be reset before firing ${dataLayerSpec.event}.`,
            dataLayerSpec
          );
        }
        return this.dataLayerValidationUtilsService.validateKeyValues(
          dataLayerSpec,
          eventObj
        );
      }
    }

    return new ValidationResultDto(
      false,
      `Event not found: ${dataLayerSpec.event}`,
      dataLayerSpec
    );
  }
}
