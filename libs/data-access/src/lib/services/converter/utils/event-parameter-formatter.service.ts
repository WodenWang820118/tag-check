import { Injectable } from '@angular/core';
import { Parameter } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class EventParameterFormatter {
  /**
   * Formats an object into an array of key-value pairs, where each key is treated as a name and each value as a value.
   * The first character of each value is omitted.
   * @param params - An object where each key-value pair represents a parameter.
   * @returns An array of objects, each containing 'name' and 'value' properties.
   */
  formatParameters(params: Record<string, string>): Parameter[] {
    return Object.keys(params).map((key) => {
      const value = Array.isArray(params[key]) ? key : params[key].slice(1);
      // use only key for both name and value
      // because the value has other usage in the app
      // the 'v' indicates the variable is a dataLayer variable
      return { key: key, value: key, type: 'v' };
    });
  }

  /**
   * Formats the parameters of a single event.
   * If the event parameters contain an 'ecommerce' key, the value of this key is also formatted and combined with the rest of the parameters.
   * Otherwise, the function just formats the parameters.
   * @param eventParams - A stringified JSON representing event parameters.
   * @returns An array of objects, each containing 'name' and 'value' properties.
   */
  formatSingleEventParameters(eventParams: string): Parameter[] {
    const parsedEventParams = JSON.parse(eventParams);
    const ecommerceString = 'ecommerce';

    if (parsedEventParams.hasOwnProperty(ecommerceString)) {
      const { ecommerce, ...rest } = parsedEventParams;
      // TODO: workaround to add the prefix '$ecommerce.' manully to the ecommerce object
      // Should be checking the dataLayers path for the prefix 'ecommerce.'
      Object.keys(ecommerce).forEach((key) => {
        ecommerce[key] = `$ecommerce.${key}`;
      });
      console.log('ecommerce: ', ecommerce);
      const ecommerceParams = this.formatParameters(ecommerce);
      const restParams = this.formatParameters(rest);
      const formattedParams = [...ecommerceParams, ...restParams];
      console.log(
        'formattedParams after formatting ecommerce: ',
        formattedParams
      );
      return formattedParams;
    }
    const formattedParams = this.formatParameters(parsedEventParams);
    console.log('formattedParams after formatting: ', formattedParams);
    return formattedParams;
  }
}
