import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationStrategy,
} from '@utils';
import { collectKeys, compareKeys } from '../utilities';

export class EcommerceEventValidationStrategy implements ValidationStrategy {
  ecommerceReset = false;
  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    for (const eventObj of dataLayer) {
      // If ecommerce is being set to null, set the flag
      if ('ecommerce' in eventObj && eventObj.ecommerce === null) {
        this.ecommerceReset = true;
      }

      // If the event is found according to the spec, check the flag
      if (eventObj.event === dataLayerSpec.event) {
        if (!this.ecommerceReset) {
          console.log(
            `Error: ecommerce must be reset before firing ${dataLayerSpec.event}.`
          );
          return {
            passed: false,
            message: 'ecommerce not reset',
            dataLayer: eventObj,
            dataLayerSpec: dataLayerSpec,
          };
        } else {
          // Reset the ecommerce flag for future checks
          const specKeys = collectKeys(dataLayerSpec);
          const eventObjKeys = collectKeys(eventObj);
          const missingKeys = compareKeys(specKeys, eventObjKeys);
          this.ecommerceReset = false;
          return missingKeys.length === 0
            ? {
                passed: true,
                message: 'Valid',
                dataLayer: eventObj,
                dataLayerSpec: dataLayerSpec,
              }
            : {
                passed: false,
                message: 'Missing keys',
                incorrectInfo: missingKeys,
                dataLayer: eventObj,
                dataLayerSpec: dataLayerSpec,
              };
        }
      }
    }
    return {
      passed: false,
      message: 'Event not found',
      dataLayerSpec: dataLayerSpec,
    };
  }
}

export class OldGA4EventsValidationStrategy {
  validateDataLayer(
    dataLayer: StrictDataLayerEvent[] | BaseDataLayerEvent[],
    dataLayerSpec: StrictDataLayerEvent
  ) {
    for (const eventObj of dataLayer) {
      if (eventObj.event === dataLayerSpec.event) {
        const specKeys = collectKeys(dataLayerSpec);
        const eventObjKeys = collectKeys(eventObj);
        const missingKeys = compareKeys(specKeys, eventObjKeys);
        return missingKeys.length === 0
          ? {
              passed: true,
              message: 'Valid',
              dataLayer: eventObj,
              dataLayerSpec: dataLayerSpec,
            }
          : {
              passed: false,
              message: 'Missing keys',
              incorrectInfo: missingKeys,
              dataLayer: eventObj,
              dataLayerSpec: dataLayerSpec,
            };
      }
    }

    return {
      passed: false,
      message: 'Event not found',
      dataLayerSpec: dataLayerSpec,
    };
  }
}
