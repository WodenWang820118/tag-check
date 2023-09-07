import { DataLayerEvent } from '../interfaces/dataLayer.interface';
import { collectKeys, compareKeys } from './utilities';

export enum ValidationStrategyType {
  ECOMMERCE = 'ecommerce',
  OLDGA4EVENTS = 'oldGA4Events',
}

export interface ValidationStrategy {
  validateDataLayer(
    dataLayer: DataLayerEvent[],
    spec: DataLayerEvent
  ): boolean | any[];
}

export class EcommerceEventValidationStrategy implements ValidationStrategy {
  ecommerceReset = false;
  validateDataLayer(dataLayer: DataLayerEvent[], spec: DataLayerEvent) {
    for (let i = 0; i < dataLayer.length; i++) {
      const eventObj = dataLayer[i];

      // If ecommerce is being set to null, set the flag
      if ('ecommerce' in eventObj && eventObj.ecommerce === null) {
        this.ecommerceReset = true;
      }

      // If the event is found according to the spec, check the flag
      if (eventObj.event === spec.event) {
        if (!this.ecommerceReset) {
          console.log(
            'Error: ecommerce must be reset before firing add_payment_info.'
          );
          return false;
        } else {
          // Reset the ecommerce flag for future checks
          const specKeys = collectKeys(spec);
          const eventObjKeys = collectKeys(eventObj);
          const missingKeys = compareKeys(specKeys, eventObjKeys);
          this.ecommerceReset = false;
          return missingKeys.length === 0 ? true : missingKeys;
        }
      }
    }
    return false;
  }
}

export class OldGA4EventsValidationStrategy {
  validateDataLayer(dataLayer: DataLayerEvent[], spec: DataLayerEvent) {
    for (let i = 0; i < dataLayer.length; i++) {
      const eventObj = dataLayer[i];
      const specKeys = collectKeys(spec);
      const eventObjKeys = collectKeys(eventObj);
      const missingKeys = compareKeys(specKeys, eventObjKeys);
      return missingKeys.length === 0 ? true : missingKeys;
    }
  }
}
