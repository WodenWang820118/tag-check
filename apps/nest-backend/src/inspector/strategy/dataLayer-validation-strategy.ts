import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationStrategy,
} from '@utils';
import { ValidationResultDto } from '../../dto/validation-result.dto';
import { Logger } from '@nestjs/common';
import { validateKeyValues } from '../utilities';

export class EcommerceEventValidationStrategy implements ValidationStrategy {
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
          console.log(
            `Error: ecommerce must be reset before firing ${dataLayerSpec.event}.`
          );
          return new ValidationResultDto(
            false,
            `ecommerce must be reset before firing ${dataLayerSpec.event}.`,
            dataLayerSpec
          );
        }
        return validateKeyValues(dataLayerSpec, eventObj);
      }
    }

    return new ValidationResultDto(
      false,
      `Event not found: ${dataLayerSpec.event}`,
      dataLayerSpec
    );
  }
}

export class OldGA4EventsValidationStrategy {
  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    for (const eventObj of dataLayer) {
      if (eventObj.event === dataLayerSpec.event) {
        return validateKeyValues(dataLayerSpec, eventObj);
      }
    }

    return new ValidationResultDto(
      false,
      `Event not found: ${dataLayerSpec.event}`,
      dataLayerSpec
    );
  }
}
